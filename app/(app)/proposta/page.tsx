import { PropostaGerador } from '@/components/proposta/PropostaGerador'

export const metadata = {
  title: 'Gerador de Propostas | Sales Co-Pilot',
}

export default function PropostaPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PropostaGerador />
    </div>
  )
}
