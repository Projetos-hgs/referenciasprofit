// Layout autenticado — BPO Financeiro
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientProvider } from '@/lib/client-context'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <ClientProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header userEmail={user.email} />
          <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ClientProvider>
  )
}
