'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Check, Clock, AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Tarefa, Prioridade, StatusTarefa } from '@/types'

interface TaskBoardProps {
  initialTarefas: Tarefa[]
}

const origemLabels = {
  chefe: 'Chefe',
  cliente: 'Cliente',
  interna: 'Interna',
  propria: 'Própria',
  sdr: 'SDR',
}

const prioridadeConfig = {
  alta: { label: 'Alta', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  media: { label: 'Média', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  baixa: { label: 'Baixa', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

type OrigemType = 'chefe' | 'cliente' | 'interna' | 'propria' | 'sdr'

export function TaskBoard({ initialTarefas }: TaskBoardProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(initialTarefas)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    origem: 'propria' as OrigemType,
    prioridade: 'media' as Prioridade,
    prazo: '',
  })
  const supabase = createClient()

  const pendentes = tarefas.filter(t => t.status === 'pendente')
  const concluidas = tarefas.filter(t => t.status === 'concluida')

  async function handleCreate() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const nova: Omit<Tarefa, 'id'> = {
        user_id: user.id,
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        origem: form.origem,
        prioridade: form.prioridade,
        status: 'pendente',
        prazo: form.prazo || undefined,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from('tarefas').insert(nova).select().single()
      if (!error && data) {
        setTarefas(prev => [data as Tarefa, ...prev])
        setForm({ titulo: '', descricao: '', origem: 'propria', prioridade: 'media', prazo: '' })
        setOpen(false)
      }
    } catch (err) {
      console.error('Error creating task:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(tarefa: Tarefa) {
    const newStatus: StatusTarefa = tarefa.status === 'pendente' ? 'concluida' : 'pendente'
    const updates = {
      status: newStatus,
      concluida_em: newStatus === 'concluida' ? new Date().toISOString() : undefined,
    }

    const { error } = await supabase.from('tarefas').update(updates).eq('id', tarefa.id)
    if (!error) {
      setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, ...updates } : t))
    }
  }

  function TaskItem({ tarefa }: { tarefa: Tarefa }) {
    const prio = prioridadeConfig[tarefa.prioridade]
    const isConcluida = tarefa.status === 'concluida'

    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isConcluida ? 'border-border/50 opacity-60' : 'border-border bg-card/50 hover:bg-accent/30'}`}>
        <button
          onClick={() => handleToggle(tarefa)}
          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {isConcluida ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isConcluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {tarefa.titulo}
          </p>
          {tarefa.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{tarefa.descricao}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${prio.className}`}>
              {prio.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {origemLabels[tarefa.origem]}
            </Badge>
            {tarefa.prazo && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(parseISO(tarefa.prazo), "dd/MM", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder="O que precisa ser feito..."
                  value={form.titulo}
                  onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Detalhes adicionais..."
                  value={form.descricao}
                  onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))}
                  className="bg-input border-border min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select value={form.origem} onValueChange={(v) => setForm(p => ({ ...p, origem: v as OrigemType }))}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {(Object.entries(origemLabels) as [OrigemType, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm(p => ({ ...p, prioridade: v as Prioridade }))}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm(p => ({ ...p, prazo: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancelar</Button>
              <Button onClick={handleCreate} disabled={!form.titulo || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendentes */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              Pendentes
              <Badge variant="secondary" className="ml-auto">{pendentes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa pendente</p>
            ) : (
              pendentes.map(t => <TaskItem key={t.id} tarefa={t} />)
            )}
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Concluídas
              <Badge variant="secondary" className="ml-auto">{concluidas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {concluidas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa concluída ainda</p>
            ) : (
              concluidas.slice(0, 10).map(t => <TaskItem key={t.id} tarefa={t} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

