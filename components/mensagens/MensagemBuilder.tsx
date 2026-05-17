'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Copy, Check, Mail, MessageCircle, Linkedin } from 'lucide-react'
import type { Deal, Canal, TipoMensagem } from '@/types'

interface MensagemBuilderProps {
  deals: Deal[]
}

const canalIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
}

const canalLabels: Record<Canal, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
}

const tipoLabels: Record<TipoMensagem, string> = {
  primeiro_contato: 'Primeiro Contato',
  followup: 'Follow-up',
  reativacao: 'Reativação',
}

export function MensagemBuilder({ deals }: MensagemBuilderProps) {
  const [dealId, setDealId] = useState<string>('')
  const [canal, setCanal] = useState<Canal>('email')
  const [tipo, setTipo] = useState<TipoMensagem>('primeiro_contato')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedDeal = deals.find(d => d.id === dealId)

  async function handleGenerate() {
    if (!dealId) return
    setLoading(true)
    setMensagem('')
    try {
      const response = await fetch('/api/ai/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, canal, tipo }),
      })
      const data = await response.json()
      setMensagem(data.content ?? '')
    } catch (err) {
      console.error('Error generating message:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!mensagem) return
    await navigator.clipboard.writeText(mensagem)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Log copy action
    if (selectedDeal) {
      fetch('/api/ai/mensagem', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, canal, tipo }),
      }).catch(() => {})
    }
  }

  const CanalIcon = canalIcons[canal]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configurar Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Deal / Empresa</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione um deal..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {deals.map(deal => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={(v) => setCanal(v as Canal)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(Object.entries(canalLabels) as [Canal, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Mensagem</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMensagem)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(Object.entries(tipoLabels) as [TipoMensagem, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDeal && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50 border border-border">
              <div className="flex-1 text-sm">
                <span className="font-medium text-foreground">{selectedDeal.cliente}</span>
                <span className="text-muted-foreground ml-2">— {selectedDeal.etapa}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                R$ {selectedDeal.valor.toLocaleString('pt-BR')}
              </Badge>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!dealId || loading} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Mensagem com IA
          </Button>
        </CardContent>
      </Card>

      {/* Generated message */}
      {(mensagem || loading) && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CanalIcon className="w-4 h-4 text-primary" />
                Mensagem para {canalLabels[canal]}
                <Badge variant="secondary" className="text-xs">{tipoLabels[tipo]}</Badge>
              </CardTitle>
              {mensagem && (
                <Button variant="outline" size="sm" onClick={handleCopy} className="border-border">
                  {copied ? (
                    <><Check className="w-3 h-3 mr-1 text-green-400" />Copiado!</>
                  ) : (
                    <><Copy className="w-3 h-3 mr-1" />Copiar</>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando mensagem personalizada...</span>
              </div>
            ) : (
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="min-h-[200px] bg-input border-border font-mono text-sm resize-y"
                placeholder="A mensagem gerada aparecerá aqui..."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
