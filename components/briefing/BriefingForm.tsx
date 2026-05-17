'use client'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Deal, Briefing } from '@/types'

interface BriefingFormProps {
  deal: Deal
  initialBriefing?: Briefing | null
}

type BriefingFields = Omit<Briefing, 'id' | 'user_id' | 'deal_id' | 'created_at' | 'updated_at'>

export function BriefingForm({ deal, initialBriefing }: BriefingFormProps) {
  const [fields, setFields] = useState<BriefingFields>({
    sobre_empresa: initialBriefing?.sobre_empresa ?? '',
    decisor_perfil: initialBriefing?.decisor_perfil ?? '',
    dores_conhecidas: initialBriefing?.dores_conhecidas ?? '',
    solucao_becomex: initialBriefing?.solucao_becomex ?? '',
    ultima_interacao: initialBriefing?.ultima_interacao ?? '',
    proximo_passo: initialBriefing?.proximo_passo ?? '',
    objecoes: initialBriefing?.objecoes ?? '',
    notas: initialBriefing?.notas ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const supabase = createClient()

  const handleChange = useCallback((field: keyof BriefingFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        ...fields,
        deal_id: deal.id,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (initialBriefing?.id) {
        await supabase.from('briefings').update(payload).eq('id', initialBriefing.id)
      } else {
        await supabase.from('briefings').insert(payload)
      }

      setSavedAt(new Date())
    } catch (err) {
      console.error('Error saving briefing:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleAIBriefing() {
    setLoadingAI(true)
    setAiInsight(null)
    try {
      const response = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal, briefing: fields }),
      })
      const data = await response.json()
      setAiInsight(data.content)
    } catch (err) {
      console.error('Error getting AI briefing:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  async function handleProximoPasso() {
    setLoadingAI(true)
    try {
      const response = await fetch('/api/ai/proximo-passo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal, briefing: fields }),
      })
      const data = await response.json()
      handleChange('proximo_passo', data.content)
    } catch (err) {
      console.error('Error getting next step:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  const fieldConfig = [
    { key: 'sobre_empresa' as const, label: 'Sobre a Empresa', placeholder: 'Descreva o contexto da empresa, segmento, desafios atuais...' },
    { key: 'decisor_perfil' as const, label: 'Perfil do Decisor', placeholder: 'Quem decide? Qual o perfil, motivações, estilo de comunicação...' },
    { key: 'dores_conhecidas' as const, label: 'Dores Conhecidas', placeholder: 'Quais problemas tributários/aduaneiros eles enfrentam...' },
    { key: 'solucao_becomex' as const, label: 'Solução Becomex', placeholder: 'Como nossa solução resolve as dores identificadas...' },
    { key: 'ultima_interacao' as const, label: 'Última Interação', placeholder: 'O que foi discutido na última reunião/contato...' },
    { key: 'objecoes' as const, label: 'Objeções Identificadas', placeholder: 'Quais objeções foram levantadas ou você antecipa...' },
    { key: 'notas' as const, label: 'Notas Gerais', placeholder: 'Outras informações relevantes...' },
  ]

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={handleAIBriefing} variant="outline" disabled={loadingAI} className="border-border">
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-primary" />}
            Gerar Briefing IA
          </Button>
          <Button onClick={handleProximoPasso} variant="outline" disabled={loadingAI} className="border-border">
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />}
            Sugerir Próximo Passo
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Salvo às {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* AI Output */}
      {aiInsight && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Briefing Gerado pela IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{aiInsight}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form fields */}
      <div className="grid gap-4">
        {fieldConfig.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
            <Textarea
              id={key}
              placeholder={placeholder}
              value={fields[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="min-h-[80px] bg-input border-border resize-y"
            />
          </div>
        ))}

        {/* Próximo passo with AI button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="proximo_passo" className="text-sm font-medium">Próximo Passo</Label>
          </div>
          <Textarea
            id="proximo_passo"
            placeholder="Qual é o próximo passo definido para avançar esta oportunidade..."
            value={fields.proximo_passo ?? ''}
            onChange={(e) => handleChange('proximo_passo', e.target.value)}
            className="min-h-[80px] bg-input border-border resize-y"
          />
        </div>
      </div>
    </div>
  )
}
