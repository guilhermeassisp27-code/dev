import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Gestão de equipe da conta multiusuário (Prioridade 4).
// Chamada pelo tool.html (app.selosales.com.br) com o JWT do usuário
// logado — por isso o CORS explícito abaixo. Toda escrita passa por
// aqui (service role): valida papel de admin e o limite de assentos.
//   GET    -> conta do usuário + lista de membros
//   POST   {email}  -> convida membro (cria usuário se preciso + email de senha)
//   DELETE {userId} -> remove membro (revoga acesso se veio por esta conta)
// ============================================================

const TOOL_ORIGIN = (process.env.NEXT_PUBLIC_TOOL_URL ?? 'https://app.selosales.com.br').replace(/\/$/, '')

function cors<T extends NextResponse>(res: T): T {
  res.headers.set('Access-Control-Allow-Origin', TOOL_ORIGIN)
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'authorization, content-type')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type Membro = { account_id: string; user_id: string; email: string; papel: string }
type Conta = {
  id: string
  owner_id: string
  nome: string
  plano: string
  max_users: number
  marca_forcada: Record<string, unknown> | null
}

type Ctx = {
  supabase: ReturnType<typeof admin>
  userId: string
  conta: Conta
  papel: string
  souAdmin: boolean
}

// Resolve o usuário do JWT e a conta em que ele é membro.
// M22: quem é membro de 2+ contas pode indicar QUAL conta via ?account_id=
// (GET) ou body.accountId (POST/DELETE) — sem indicação, o comportamento
// antigo (primeira conta) vale, então usuários de conta única não mudam.
async function contexto(req: NextRequest, accountId?: string): Promise<Ctx | null> {
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return null
  const supabase = admin()
  const { data: auth, error } = await supabase.auth.getUser(jwt)
  if (error || !auth?.user) return null

  let query = supabase
    .from('cpr_account_members')
    .select('account_id, papel')
    .eq('user_id', auth.user.id)
  if (accountId) query = query.eq('account_id', accountId)
  const { data: memb } = await query.limit(1).maybeSingle()
  if (!memb) return null

  const { data: conta } = await supabase
    .from('cpr_accounts')
    .select('id, owner_id, nome, plano, max_users, marca_forcada')
    .eq('id', memb.account_id as string)
    .maybeSingle()
  if (!conta) return null

  const c = conta as Conta
  return {
    supabase,
    userId: auth.user.id,
    conta: c,
    papel: String(memb.papel ?? 'corretor'),
    souAdmin: memb.papel === 'admin' || c.owner_id === auth.user.id,
  }
}

async function listarMembros(ctx: Ctx): Promise<Membro[]> {
  const { data } = await ctx.supabase
    .from('cpr_account_members')
    .select('account_id, user_id, email, papel')
    .eq('account_id', ctx.conta.id)
    .order('created_at', { ascending: true })
  return (data ?? []) as Membro[]
}

export async function GET(req: NextRequest) {
  const ctx = await contexto(req, req.nextUrl.searchParams.get('account_id') || undefined)
  if (!ctx) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
  const membros = await listarMembros(ctx)
  return cors(
    NextResponse.json({
      conta: {
        id: ctx.conta.id,
        nome: ctx.conta.nome,
        plano: ctx.conta.plano,
        maxUsers: ctx.conta.max_users,
        marcaForcada: ctx.conta.marca_forcada,
        souAdmin: ctx.souAdmin,
      },
      membros: membros.map((m) => ({ userId: m.user_id, email: m.email, papel: m.papel })),
    })
  )
}

// Localiza um usuário existente pelo email (mesmo padrão do webhook).
// Achado C6 da auditoria: caminho rápido via função SQL indexada; o scan
// paginado da base inteira fica só como fallback pré-migração.
async function findUser(supabase: ReturnType<typeof admin>, alvo: string) {
  const rpc = await supabase.rpc('cpr_user_id_by_email', { p_email: alvo })
  if (!rpc.error) {
    if (!rpc.data) return undefined
    const { data, error } = await supabase.auth.admin.getUserById(String(rpc.data))
    if (!error && data?.user) return data.user
    return undefined
  }
  console.error('[conta-membros] rpc cpr_user_id_by_email indisponível, usando scan:', rpc.error.message)
  const perPage = 200
  for (let page = 1; page <= 500; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) break
    const users = data?.users ?? []
    const achado = users.find((u) => (u.email ?? '').toLowerCase() === alvo)
    if (achado) return achado
    if (users.length < perPage) break
  }
  return undefined
}

// M14: limite de convites por admin (10 a cada 10 min). Em memória — vale por
// instância da função, então não é garantia dura, mas fecha o abuso barato de
// disparar resetPasswordForEmail em massa para emails arbitrários.
const _convites = new Map<string, number[]>()
function convitesExcedidos(userId: string): boolean {
  const agora = Date.now()
  const janela = (_convites.get(userId) ?? []).filter((t) => agora - t < 10 * 60_000)
  if (janela.length >= 10) return true
  janela.push(agora)
  _convites.set(userId, janela)
  return false
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return cors(NextResponse.json({ error: 'invalid json' }, { status: 400 }))
  }

  const ctx = await contexto(req, body.accountId ? String(body.accountId) : undefined)
  if (!ctx) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
  if (!ctx.souAdmin)
    return cors(NextResponse.json({ error: 'apenas o admin da conta convida membros' }, { status: 403 }))
  if (convitesExcedidos(ctx.userId))
    return cors(NextResponse.json({ error: 'muitos convites em pouco tempo — aguarde alguns minutos' }, { status: 429 }))

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return cors(NextResponse.json({ error: 'email inválido' }, { status: 400 }))

  const membros = await listarMembros(ctx)
  if (membros.length >= ctx.conta.max_users)
    return cors(
      NextResponse.json(
        { error: `limite do plano atingido (${ctx.conta.max_users} usuário${ctx.conta.max_users === 1 ? '' : 's'})` },
        { status: 409 }
      )
    )
  if (membros.some((m) => m.email.toLowerCase() === email))
    return cors(NextResponse.json({ error: 'este email já está na equipe' }, { status: 409 }))

  const { supabase } = ctx
  const existente = await findUser(supabase, email)
  let userId = existente?.id
  // null = nenhum email era necessário (convidado já tinha conta/senha)
  let emailSent: boolean | null = null

  if (!existente) {
    // Cria o acesso do convidado; o email de definir senha sai em seguida.
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { subscription_status: 'active', plan: 'equipe', via_account: ctx.conta.id },
    })
    if (createErr && !/already|registered|exist/i.test(createErr.message)) {
      console.error('[conta-membros] createUser falhou:', createErr.message)
      return cors(NextResponse.json({ error: 'falha ao criar acesso do convidado' }, { status: 500 }))
    }
    userId = created?.user?.id ?? (await findUser(supabase, email))?.id
    if (userId) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '') || 'https://selosales.com.br'
      const { error: mailErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/definir-senha`,
      })
      // M14: o resultado do email vai no JSON (emailSent) — o admin precisa
      // saber que o convidado NÃO recebeu o link para reenviar/avisar.
      emailSent = !mailErr
      if (mailErr) console.error('[conta-membros] envio do link de senha falhou:', mailErr.message)
    }
  } else {
    // Já existe: se estiver inativo (ex.: cancelou a própria assinatura),
    // o assento da conta reativa o acesso e marca de onde ele veio. Quem
    // já está ativo com assinatura própria só entra na equipe.
    const meta = (existente.app_metadata ?? {}) as Record<string, unknown>
    if (meta.subscription_status !== 'active') {
      await supabase.auth.admin.updateUserById(existente.id, {
        ban_duration: 'none',
        app_metadata: { ...meta, subscription_status: 'active', via_account: ctx.conta.id },
      })
    }
  }

  if (!userId) return cors(NextResponse.json({ error: 'falha ao resolver o convidado' }, { status: 500 }))

  const { error: membErr } = await supabase
    .from('cpr_account_members')
    .upsert(
      { account_id: ctx.conta.id, user_id: userId, email, papel: 'corretor' },
      { onConflict: 'account_id,user_id' }
    )
  if (membErr) {
    console.error('[conta-membros] vínculo falhou:', membErr.message)
    return cors(NextResponse.json({ error: 'falha ao vincular membro' }, { status: 500 }))
  }

  // M14: o check de assentos lá em cima corre contra convites concorrentes
  // (check-then-insert). Recontagem pós-upsert com compensação: se a corrida
  // estourou o limite, desfaz ESTE vínculo e devolve 409 — sem precisar de
  // migração/lock no banco.
  const { count } = await supabase
    .from('cpr_account_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('account_id', ctx.conta.id)
  if ((count ?? 0) > ctx.conta.max_users) {
    await supabase
      .from('cpr_account_members')
      .delete()
      .eq('account_id', ctx.conta.id)
      .eq('user_id', userId)
    return cors(
      NextResponse.json(
        { error: `limite do plano atingido (${ctx.conta.max_users} usuário${ctx.conta.max_users === 1 ? '' : 's'})` },
        { status: 409 }
      )
    )
  }

  return cors(NextResponse.json({ ok: true, userId, emailSent }))
}

export async function DELETE(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return cors(NextResponse.json({ error: 'invalid json' }, { status: 400 }))
  }

  const ctx = await contexto(req, body.accountId ? String(body.accountId) : undefined)
  if (!ctx) return cors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
  if (!ctx.souAdmin)
    return cors(NextResponse.json({ error: 'apenas o admin da conta remove membros' }, { status: 403 }))
  const alvo = String(body.userId ?? '')
  if (!alvo) return cors(NextResponse.json({ error: 'userId obrigatório' }, { status: 400 }))
  if (alvo === ctx.conta.owner_id)
    return cors(NextResponse.json({ error: 'o dono da conta não pode ser removido' }, { status: 400 }))

  const { supabase } = ctx
  const { error: delErr } = await supabase
    .from('cpr_account_members')
    .delete()
    .eq('account_id', ctx.conta.id)
    .eq('user_id', alvo)
  if (delErr) {
    console.error('[conta-membros] remoção falhou:', delErr.message)
    return cors(NextResponse.json({ error: 'falha ao remover membro' }, { status: 500 }))
  }

  // Se o acesso do removido veio deste assento, revoga (dados preservados,
  // mesmo padrão do cancelamento no webhook).
  const { data: u } = await supabase.auth.admin.getUserById(alvo)
  const meta = (u?.user?.app_metadata ?? {}) as Record<string, unknown>
  if (meta.via_account === ctx.conta.id) {
    await supabase.auth.admin.updateUserById(alvo, {
      ban_duration: '87600h',
      app_metadata: { ...meta, subscription_status: 'inactive', via_account: null },
    })
  }

  return cors(NextResponse.json({ ok: true }))
}
