#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::Env;

fn setup(env: &Env) -> (Address, TrikeContractClient<'_>) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let contract_id = env.register(TrikeContract, ());
    let client = TrikeContractClient::new(env, &contract_id);
    client.initialize(&admin);
    (admin, client)
}

fn advance_time(env: &Env, seconds: u64) {
    env.ledger().with_mut(|li| {
        li.timestamp += seconds;
    });
}

#[test]
fn transfer_below_threshold_is_auto_approved() {
    let env = Env::default();
    let (_admin, client) = setup(&env);

    let owner = Address::generate(&env);
    let principal = Address::generate(&env);
    let secondary = Address::generate(&env);
    let to = Address::generate(&env);

    client.register_account(&owner, &principal, &secondary, &None);

    let id = client.request_transfer(&owner, &to, &1_000);
    let request = client.get_request(&id);

    assert_eq!(request.status, RequestStatus::Approved);
    assert!(!request.risky);
}

#[test]
fn transfer_over_threshold_requires_principal_approval() {
    let env = Env::default();
    let (_admin, client) = setup(&env);

    let owner = Address::generate(&env);
    let principal = Address::generate(&env);
    let secondary = Address::generate(&env);
    let to = Address::generate(&env);

    client.register_account(&owner, &principal, &secondary, &None);

    let id = client.request_transfer(&owner, &to, &25_000);
    let request = client.get_request(&id);
    assert_eq!(request.status, RequestStatus::PendingPrincipal);
    assert!(request.risky);

    client.approve_transfer(&principal, &id);
    let approved = client.get_request(&id);
    assert_eq!(approved.status, RequestStatus::Approved);
    assert_eq!(approved.approved_by, Some(principal));
}

#[test]
fn secondary_can_approve_after_principal_window_expires() {
    let env = Env::default();
    let (_admin, client) = setup(&env);

    let owner = Address::generate(&env);
    let principal = Address::generate(&env);
    let secondary = Address::generate(&env);
    let to = Address::generate(&env);

    client.register_account(&owner, &principal, &secondary, &None);
    let id = client.request_transfer(&owner, &to, &25_000);

    // Avanza más allá de la ventana del principal (4h) pero dentro del total (12h)
    advance_time(&env, PRINCIPAL_WINDOW + 60);

    let result = client.try_approve_transfer(&principal, &id);
    assert!(result.is_err());

    client.approve_transfer(&secondary, &id);
    let approved = client.get_request(&id);
    assert_eq!(approved.status, RequestStatus::Approved);
    assert_eq!(approved.approved_by, Some(secondary));
}

#[test]
fn request_is_cancelled_after_total_window_without_approval() {
    let env = Env::default();
    let (_admin, client) = setup(&env);

    let owner = Address::generate(&env);
    let principal = Address::generate(&env);
    let secondary = Address::generate(&env);
    let to = Address::generate(&env);

    client.register_account(&owner, &principal, &secondary, &None);
    let id = client.request_transfer(&owner, &to, &25_000);

    advance_time(&env, TOTAL_WINDOW + 60);

    let status = client.expire_request(&id);
    assert_eq!(status, RequestStatus::Cancelled);
}

#[test]
fn recent_deposit_flags_small_transfer_as_risky() {
    let env = Env::default();
    let (admin, client) = setup(&env);

    let owner = Address::generate(&env);
    let principal = Address::generate(&env);
    let secondary = Address::generate(&env);
    let to = Address::generate(&env);

    client.register_account(&owner, &principal, &secondary, &None);
    client.record_deposit(&admin, &owner, &500_000);

    let id = client.request_transfer(&owner, &to, &1_000);
    let request = client.get_request(&id);

    assert!(request.risky);
    assert_eq!(request.status, RequestStatus::PendingPrincipal);
    assert_eq!(request.reason, Symbol::new(&env, "DEPOSIT"));
}
