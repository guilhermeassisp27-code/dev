import { NextResponse } from 'next/server'
import { getTaxas } from '@/lib/taxas'

// Taxas de financiamento por banco (fonte: Banco Central). Cache diário.
export const revalidate = 86400

export async function GET() {
  const data = await getTaxas()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=43200' },
  })
}
