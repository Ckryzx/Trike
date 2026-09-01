#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

// Umbral por defecto: transferencias sobre este monto requieren aprobación de guardián.
const DEFAULT_THRESHOLD: i128 = 20_000;

// Ventanas de aprobación (en segundos).
const PRINCIPAL_WINDOW: u64 = 4 * 3600; // 4h para que apruebe el guardián principal
const TOTAL_WINDOW: u64 = 12 * 3600; // 12h totales antes de cancelar automáticamente

// Si hubo un depósito reciente dentro de esta ventana, se considera contexto de riesgo
// (patrón típico de estafa: "te deposité de más, devuélveme la diferencia").
const DEPOSIT_LOOKBACK: u64 = 48 * 3600;

// Un monto se considera atípico si supera en este múltiplo el promedio histórico del usuario.
const BEHAVIOR_MULTIPLIER: i128 = 3;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TrikeError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    AccountAlreadyRegistered = 3,
    AccountNotFound = 4,
    RequestNotFound = 5,
    RequestNotPending = 6,
    RequestExpired = 7,
    UnauthorizedGuardian = 8,
    PrincipalWindowExpired = 9,
    NotYetSecondaryWindow = 10,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Account(Address),
    Request(u64),
    RequestCounter,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ProtectedAccount {
    pub owner: Address,
    pub principal_guardian: Address,
    pub secondary_guardian: Address,
    pub threshold: i128,
    pub avg_transfer: i128,
    pub max_transfer: i128,
    pub transfer_count: u32,
    pub recent_deposit_amount: i128,
    pub recent_deposit_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RequestStatus {
    PendingPrincipal = 0,
    PendingSecondary = 1,
    Approved = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct TransferRequest {
    pub id: u64,
    pub owner: Address,
    pub to: Address,
    pub amount: i128,
    pub created_at: u64,
    pub status: RequestStatus,
    pub risky: bool,
    pub reason: Symbol,
    pub approved_by: Option<Address>,
}

#[contract]
pub struct TrikeContract;

#[contractimpl]
impl TrikeContract {
    /// Inicializar contrato (solo una vez, al deploy). El admin es la cuenta
    /// oracle/backend autorizada a reportar depósitos entrantes.
    pub fn initialize(env: Env, admin: Address) -> Result<(), TrikeError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(TrikeError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Registrar a un adulto mayor con sus dos guardianes (principal y secundario).
    pub fn register_account(
        env: Env,
        owner: Address,
        principal_guardian: Address,
        secondary_guardian: Address,
        threshold: Option<i128>,
    ) -> Result<(), TrikeError> {
        owner.require_auth();

        let key = DataKey::Account(owner.clone());
        if env.storage().persistent().has(&key) {
            return Err(TrikeError::AccountAlreadyRegistered);
        }

        let account = ProtectedAccount {
            owner: owner.clone(),
            principal_guardian,
            secondary_guardian,
            threshold: threshold.unwrap_or(DEFAULT_THRESHOLD),
            avg_transfer: 0,
            max_transfer: 0,
            transfer_count: 0,
            recent_deposit_amount: 0,
            recent_deposit_at: 0,
        };
        env.storage().persistent().set(&key, &account);
        Ok(())
    }

    /// Ajustar el umbral fijo de un usuario (lo hace el propio dueño de la cuenta).
    pub fn set_threshold(env: Env, owner: Address, threshold: i128) -> Result<(), TrikeError> {
        owner.require_auth();
        let mut account = Self::load_account(&env, &owner)?;
        account.threshold = threshold;
        env.storage()
            .persistent()
            .set(&DataKey::Account(owner), &account);
        Ok(())
    }

    /// Reportar un depósito entrante detectado por el backend/oracle.
    pub fn record_deposit(
        env: Env,
        admin: Address,
        owner: Address,
        amount: i128,
    ) -> Result<(), TrikeError> {
        Self::require_admin(&env, &admin)?;
        let mut account = Self::load_account(&env, &owner)?;
        account.recent_deposit_amount = amount;
        account.recent_deposit_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Account(owner), &account);
        Ok(())
    }

    /// Solicitar una transferencia saliente. Si no es riesgosa queda aprobada de
    /// inmediato; si lo es, queda pendiente de aprobación del guardián principal.
    pub fn request_transfer(
        env: Env,
        owner: Address,
        to: Address,
        amount: i128,
    ) -> Result<u64, TrikeError> {
        owner.require_auth();
        let mut account = Self::load_account(&env, &owner)?;
        let now = env.ledger().timestamp();

        let over_threshold = amount >= account.threshold;
        let behavior_flag =
            account.transfer_count > 0 && amount > account.avg_transfer * BEHAVIOR_MULTIPLIER;
        let deposit_flag = account.recent_deposit_amount > 0
            && now.saturating_sub(account.recent_deposit_at) <= DEPOSIT_LOOKBACK;
        let risky = over_threshold || behavior_flag || deposit_flag;

        let reason = if over_threshold && (behavior_flag || deposit_flag) {
            Symbol::new(&env, "MULTIPLE")
        } else if over_threshold {
            Symbol::new(&env, "THRESHOLD")
        } else if behavior_flag {
            Symbol::new(&env, "BEHAVIOR")
        } else if deposit_flag {
            Symbol::new(&env, "DEPOSIT")
        } else {
            Symbol::new(&env, "NONE")
        };

        let id = Self::next_request_id(&env);
        let status = if risky {
            RequestStatus::PendingPrincipal
        } else {
            RequestStatus::Approved
        };

        let request = TransferRequest {
            id,
            owner: owner.clone(),
            to,
            amount,
            created_at: now,
            status: status.clone(),
            risky,
            reason,
            approved_by: None,
        };
        env.storage().persistent().set(&DataKey::Request(id), &request);

        if !risky {
            Self::update_stats(&mut account, amount);
            env.storage()
                .persistent()
                .set(&DataKey::Account(owner), &account);
        }

        Ok(id)
    }

    /// Aprobar una transferencia pendiente. Solo el guardián que corresponde a la
    /// ventana de tiempo actual (principal primero, secundario después) puede aprobar.
    pub fn approve_transfer(
        env: Env,
        guardian: Address,
        request_id: u64,
    ) -> Result<(), TrikeError> {
        guardian.require_auth();

        let mut request = Self::load_request(&env, request_id)?;
        if request.status != RequestStatus::PendingPrincipal
            && request.status != RequestStatus::PendingSecondary
        {
            return Err(TrikeError::RequestNotPending);
        }

        let mut account = Self::load_account(&env, &request.owner)?;
        let now = env.ledger().timestamp();
        let elapsed = now.saturating_sub(request.created_at);

        if elapsed > TOTAL_WINDOW {
            request.status = RequestStatus::Cancelled;
            env.storage()
                .persistent()
                .set(&DataKey::Request(request_id), &request);
            return Err(TrikeError::RequestExpired);
        }

        let is_principal = guardian == account.principal_guardian;
        let is_secondary = guardian == account.secondary_guardian;

        if is_principal && elapsed <= PRINCIPAL_WINDOW {
            // ok
        } else if is_secondary && elapsed > PRINCIPAL_WINDOW {
            // ok
        } else if is_principal {
            return Err(TrikeError::PrincipalWindowExpired);
        } else if is_secondary {
            return Err(TrikeError::NotYetSecondaryWindow);
        } else {
            return Err(TrikeError::UnauthorizedGuardian);
        }

        request.status = RequestStatus::Approved;
        request.approved_by = Some(guardian);
        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id), &request);

        Self::update_stats(&mut account, request.amount);
        env.storage()
            .persistent()
            .set(&DataKey::Account(request.owner), &account);

        Ok(())
    }

    /// Rechazar explícitamente una transferencia sospechosa (ej. el guardián confirma
    /// que es una estafa). Puede hacerlo el guardián principal o el secundario.
    pub fn reject_transfer(
        env: Env,
        guardian: Address,
        request_id: u64,
    ) -> Result<(), TrikeError> {
        guardian.require_auth();

        let mut request = Self::load_request(&env, request_id)?;
        if request.status != RequestStatus::PendingPrincipal
            && request.status != RequestStatus::PendingSecondary
        {
            return Err(TrikeError::RequestNotPending);
        }

        let account = Self::load_account(&env, &request.owner)?;
        if guardian != account.principal_guardian && guardian != account.secondary_guardian {
            return Err(TrikeError::UnauthorizedGuardian);
        }

        request.status = RequestStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Request(request_id), &request);
        Ok(())
    }

    /// Cancelar automáticamente una solicitud vencida (nadie aprobó a tiempo).
    /// Cualquiera puede invocarla (ej. un job del backend); es solo una constatación
    /// de un hecho determinista sobre el timestamp del ledger.
    pub fn expire_request(env: Env, request_id: u64) -> Result<RequestStatus, TrikeError> {
        let mut request = Self::load_request(&env, request_id)?;
        if request.status == RequestStatus::PendingPrincipal
            || request.status == RequestStatus::PendingSecondary
        {
            let now = env.ledger().timestamp();
            if now.saturating_sub(request.created_at) > TOTAL_WINDOW {
                request.status = RequestStatus::Cancelled;
                env.storage()
                    .persistent()
                    .set(&DataKey::Request(request_id), &request);
            }
        }
        Ok(request.status)
    }

    pub fn get_request(env: Env, request_id: u64) -> Result<TransferRequest, TrikeError> {
        Self::load_request(&env, request_id)
    }

    pub fn get_account(env: Env, owner: Address) -> Result<ProtectedAccount, TrikeError> {
        Self::load_account(&env, &owner)
    }

    pub fn is_approved(env: Env, request_id: u64) -> Result<bool, TrikeError> {
        let request = Self::load_request(&env, request_id)?;
        Ok(request.status == RequestStatus::Approved)
    }
}

impl TrikeContract {
    fn require_admin(env: &Env, admin: &Address) -> Result<(), TrikeError> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(TrikeError::NotInitialized)?;
        if *admin != stored_admin {
            return Err(TrikeError::UnauthorizedGuardian);
        }
        Ok(())
    }

    fn load_account(env: &Env, owner: &Address) -> Result<ProtectedAccount, TrikeError> {
        env.storage()
            .persistent()
            .get(&DataKey::Account(owner.clone()))
            .ok_or(TrikeError::AccountNotFound)
    }

    fn load_request(env: &Env, request_id: u64) -> Result<TransferRequest, TrikeError> {
        env.storage()
            .persistent()
            .get(&DataKey::Request(request_id))
            .ok_or(TrikeError::RequestNotFound)
    }

    fn next_request_id(env: &Env) -> u64 {
        let current: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RequestCounter)
            .unwrap_or(0);
        let next = current + 1;
        env.storage()
            .instance()
            .set(&DataKey::RequestCounter, &next);
        next
    }

    fn update_stats(account: &mut ProtectedAccount, amount: i128) {
        let total = account.avg_transfer * account.transfer_count as i128 + amount;
        account.transfer_count += 1;
        account.avg_transfer = total / account.transfer_count as i128;
        if amount > account.max_transfer {
            account.max_transfer = amount;
        }
    }
}

mod test;
