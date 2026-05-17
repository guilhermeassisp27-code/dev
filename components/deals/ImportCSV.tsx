'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { parseCSV } from '@/lib/csv-parser'

interface ImportCSVProps {
  onImported?: () => void
}

type ImportStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error'

export function ImportCSV({ onImported }: ImportCSVProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setResult(null)
    setStatus('idle')
  }

  async function handleImport() {
    if (!file) return
    setStatus('parsing')

    try {
      const parseResult = await parseCSV(file)

      if (parseResult.deals.length === 0) {
        setResult({ imported: 0, errors: parseResult.errors.length > 0 ? parseResult.errors : ['Nenhum deal válido encontrado'] })
        setStatus('error')
        return
      }

      setStatus('uploading')

      const response = await fetch('/api/deals/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deals: parseResult.deals }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar')
      }

      setResult({ imported: data.imported, errors: parseResult.errors })
      setStatus('success')
      onImported?.()
    } catch (err) {
      setResult({ imported: 0, errors: [String(err)] })
      setStatus('error')
    }
  }

  function handleClose() {
    setOpen(false)
    setStatus('idle')
    setFile(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Importar Deals via CSV</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Faça upload de um arquivo CSV com seus deals. Campos suportados: cliente, valor, etapa, temperatura, probabilidade, cidade, estado, ramo, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo CSV</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Result */}
          {result && status === 'success' && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-green-950/50 border border-green-800/50">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-green-400 font-medium">{result.imported} deals importados com sucesso!</p>
                {result.errors.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{result.errors.length} linha(s) com erro ignoradas.</p>
                )}
              </div>
            </div>
          )}
          {result && status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/20 border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-destructive-foreground font-medium">Erros na importação</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {result.errors.length > 5 && <li>...e mais {result.errors.length - 5} erros.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="border-border">
            {status === 'success' ? 'Fechar' : 'Cancelar'}
          </Button>
          {status !== 'success' && (
            <Button
              onClick={handleImport}
              disabled={!file || status === 'parsing' || status === 'uploading'}
            >
              {(status === 'parsing' || status === 'uploading') && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {status === 'parsing' ? 'Processando...' : status === 'uploading' ? 'Importando...' : 'Importar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
