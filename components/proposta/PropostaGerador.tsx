'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
  Package,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Escopo {
  nome: string
  descricao: string
  entregaveis: string[]
  prazo: string
  investimento: string
  investimento_numero: number
  destaque: boolean
}

interface Objecao {
  objecao: string
  resposta: string
}

interface PropostaResult {
  escopos: Escopo[]
  proposta_completa: string
  objecoes: Objecao[]
  mensagem_apresentacao: string
}

type Estado = 'idle' | 'loading' | 'result'

const LOADING_STEPS = [
  'Analisando seu serviço e contexto...',
  'Pesquisando práticas de mercado...',
  'Calculando investimentos sugeridos...',
  'Redigindo proposta profissional...',
  'Preparando respostas para objeções...',
]

export function PropostaGerador() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [loadingStep, setLoadingStep] = useState(0)
  const [servico, setServico] = useState('')
  const [cliente, setCliente] = useState('')
  const [segmento, setSegmento] = useState('')
  const [contexto, setContexto] = useState('')
  const [resultado, setResultado] = useState<PropostaResult | null>(null)
  const [escopoSelecionado, setEscopoSelecionado] = useState(1)
  const [copied, setCopied] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const handleGerar = async () => {
    if (!servico.trim() || !cliente.trim()) return

    setEstado('loading')
    setLoadingStep(0)
    setErro(null)

    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < LOADING_STEPS.length) setLoadingStep(step)
      else clearInterval(interval)
    }, 1400)

    try {
      const res = await fetch('/api/ai/proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servico, cliente, segmento, contexto }),
      })

      clearInterval(interval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao gerar proposta')
      }

      const data: PropostaResult = await res.json()
      setResultado(data)
      const destaque = data.escopos.findIndex(e => e.destaque)
      setEscopoSelecionado(destaque >= 0 ? destaque : 1)
      setEstado('result')
    } catch (err) {
      clearInterval(interval)
      setErro(String(err))
      setEstado('idle')
    }
  }

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleNovaProposta = () => {
    setEstado('idle')
    setResultado(null)
    setEscopoSelecionado(1)
    setErro(null)
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (estado === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] gap-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Gerando sua proposta...</h2>
          <p className="text-sm text-muted-foreground mt-1">Isso leva alguns segundos</p>
        </div>

        <div className="space-y-3 w-full max-w-xs">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 text-sm transition-all duration-500',
                i < loadingStep
                  ? 'text-primary'
                  : i === loadingStep
                  ? 'text-foreground'
                  : 'text-muted-foreground/30'
              )}
            >
              {i < loadingStep ? (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              ) : i === loadingStep ? (
                <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
              ) : (
                <Circle className="w-4 h-4 flex-shrink-0" />
              )}
              {step}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Result ────────────────────────────────────────────────────────────────
  if (estado === 'result' && resultado) {
    const escopoAtual = resultado.escopos[escopoSelecionado]

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Proposta gerada com sucesso</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Selecione o escopo e copie sua proposta
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleNovaProposta} className="gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Nova proposta
          </Button>
        </div>

        {/* Scope cards */}
        <div className="grid grid-cols-3 gap-4">
          {resultado.escopos.map((escopo, i) => (
            <Card
              key={i}
              onClick={() => setEscopoSelecionado(i)}
              className={cn(
                'cursor-pointer transition-all duration-200 relative',
                escopoSelecionado === i
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                  : 'border-border hover:border-primary/40',
              )}
            >
              {escopo.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="text-xs px-2.5 py-0.5 bg-primary text-primary-foreground shadow">
                    Recomendado
                  </Badge>
                </div>
              )}
              <CardContent className="p-4 pt-5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {escopo.nome}
                </p>
                <p className="text-2xl font-bold text-foreground leading-none">{escopo.investimento}</p>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {escopo.prazo}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {escopo.entregaveis.slice(0, 4).map((e, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      {e}
                    </li>
                  ))}
                  {escopo.entregaveis.length > 4 && (
                    <li className="text-xs text-primary font-medium">
                      +{escopo.entregaveis.length - 4} entregáveis
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proposta">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="proposta" className="gap-1.5 text-xs">
              <Package className="w-3.5 h-3.5" />
              Proposta Completa
            </TabsTrigger>
            <TabsTrigger value="objecoes" className="gap-1.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              Objeções ({resultado.objecoes.length})
            </TabsTrigger>
            <TabsTrigger value="mensagem" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Mensagem de Envio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposta" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Escopo {escopoAtual?.nome} — {escopoAtual?.investimento}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => handleCopy(resultado.proposta_completa, 'proposta')}
                >
                  {copied === 'proposta' ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied === 'proposta' ? 'Copiado!' : 'Copiar'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-muted/30 rounded-lg p-4 border max-h-[500px] overflow-y-auto">
                  {resultado.proposta_completa}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objecoes" className="mt-4 space-y-3">
            {resultado.objecoes.map((obj, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground mb-2">"{obj.objecao}"</p>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">{obj.resposta}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => handleCopy(obj.resposta, `obj-${i}`)}
                    >
                      {copied === `obj-${i}` ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="mensagem" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Mensagem para enviar ao cliente
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => handleCopy(resultado.mensagem_apresentacao, 'mensagem')}
                >
                  {copied === 'mensagem' ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied === 'mensagem' ? 'Copiado!' : 'Copiar'}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-muted/30 rounded-lg p-4 border">
                  {resultado.mensagem_apresentacao}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Gerador de Propostas com IA</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Preencha 3 campos e a IA gera escopo, investimento sugerido e proposta completa em segundos.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="servico" className="text-sm font-medium">
              O que você oferece? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="servico"
              placeholder="Ex: Consultoria de marketing digital, Desenvolvimento de site, Treinamento de vendas..."
              value={servico}
              onChange={e => setServico(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cliente" className="text-sm font-medium">
                Nome do cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cliente"
                placeholder="Ex: Empresa ABC Ltda"
                value={cliente}
                onChange={e => setCliente(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="segmento" className="text-sm font-medium">
                Segmento <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="segmento"
                placeholder="Ex: Varejo, Saúde, Tech..."
                value={segmento}
                onChange={e => setSegmento(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contexto" className="text-sm font-medium">
              Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="contexto"
              placeholder="Ex: Cliente mencionou budget de R$ 5k, tem urgência para o próximo mês, principal dor é a conversão baixa..."
              value={contexto}
              onChange={e => setContexto(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro.replace('Error: ', '')}
            </div>
          )}

          <Button
            onClick={handleGerar}
            disabled={!servico.trim() || !cliente.trim()}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Proposta Completa
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { icon: Package, text: '3 opções de escopo' },
              { icon: AlertCircle, text: 'Objeções + respostas' },
              { icon: MessageSquare, text: 'Mensagem de envio' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
