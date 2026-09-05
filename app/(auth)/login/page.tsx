import { redirect } from 'next/navigation'

import { Logo } from '@/components/ui/logo'
import { createClient } from '@/lib/supabase/server'

import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/')

  const { error } = await searchParams

  return (
    <>
      <header className="flex flex-col gap-3">
        <Logo />
        <p className="text-tinta-suave text-base">
          Las cuentas de la casa, claras para todos.
        </p>
      </header>

      <LoginForm errorInicial={error} />
    </>
  )
}
