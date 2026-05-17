export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase/server'
import { TaskBoard } from '@/components/semana/TaskBoard'
import type { Tarefa } from '@/types'

export default async function SemanaPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('tarefas')
    .select('*')
    .order('created_at', { ascending: false })
  const tarefas = (data as Tarefa[]) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Semana</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas tarefas e compromissos semanais</p>
      </div>
      <TaskBoard initialTarefas={tarefas} />
    </div>
  )
}
