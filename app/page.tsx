'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck, UsersThree, Bell, Buildings } from '@phosphor-icons/react'
import { TrikeLogo } from '@/components/TrikeLogo'
import { TransactionDemo } from '@/components/TransactionDemo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const steps = [
  {
    icon: <ShieldCheck size={32} weight="bold" aria-hidden="true" />,
    title: '1. Se configura la protección',
    text: 'El titular define un umbral de monto y dos guardianes de confianza: uno principal y uno secundario.',
  },
  {
    icon: <Bell size={32} weight="bold" aria-hidden="true" />,
    title: '2. Trike detecta el riesgo',
    text: 'Si una transferencia supera el umbral, se aleja del comportamiento habitual, o llega tras un depósito sospechoso, se pausa automáticamente.',
  },
  {
    icon: <UsersThree size={32} weight="bold" aria-hidden="true" />,
    title: '3. Un guardián decide a tiempo',
    text: 'El guardián principal tiene una ventana para aprobar o rechazar. Si no responde, el guardián secundario puede hacerlo. Sin respuesta de nadie, la transferencia se cancela sola.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <motion.section
        initial="hidden"
        animate="show"
        variants={container}
        className="flex flex-col items-center gap-8 text-center"
      >
        <motion.div variants={item}>
          <TrikeLogo size={96} />
        </motion.div>
        <motion.h1 variants={item} className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
          Protege las transferencias de quienes más quieres
        </motion.h1>
        <motion.p variants={item} className="max-w-2xl text-xl text-muted-foreground">
          Trike agrega una capa de seguridad basada en smart contracts a las transferencias de adultos mayores:
          detecta movimientos riesgosos y pide la aprobación de un guardián de la familia antes de dejarlos pasar.
        </motion.p>
        <motion.div variants={item} className="flex flex-wrap justify-center gap-4">
          <Link href="/cuenta">
            <Button variant="primary">Soy el titular de la cuenta</Button>
          </Link>
          <Link href="/guardian">
            <Button variant="secondary">Soy guardián</Button>
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="mt-20"
      >
        <Card className="flex flex-col items-center gap-6 py-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Así se ve en acción</h2>
          <TransactionDemo />
          <p className="max-w-xl text-center text-base text-muted-foreground">
            Cuando una transferencia se ve riesgosa, el guardián la intercepta antes de que llegue a su destino.
          </p>
        </Card>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="mt-24 grid gap-6 md:grid-cols-3"
      >
        {steps.map((step) => (
          <motion.div key={step.title} variants={item}>
            <Card className="flex h-full flex-col gap-4">
              <span className="text-primary">{step.icon}</span>
              <h2 className="font-heading text-xl font-semibold text-foreground">{step.title}</h2>
              <p className="text-muted-foreground">{step.text}</p>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="mt-24"
      >
        <Card className="flex flex-col items-center gap-4 bg-primary text-center text-primary-foreground">
          <Buildings size={40} weight="bold" aria-hidden="true" />
          <h2 className="font-heading text-2xl font-bold">Pensado para integrarse con bancos</h2>
          <p className="max-w-2xl text-lg opacity-90">
            Trike no reemplaza a un banco: es un puente que corre sobre contratos inteligentes en Stellar
            (Soroban), pensado para que instituciones financieras lo integren y ofrezcan esta protección a
            sus clientes de mayor edad.
          </p>
        </Card>
      </motion.section>
    </div>
  )
}
