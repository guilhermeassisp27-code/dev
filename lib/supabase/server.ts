import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => createServerComponentClient({ cookies })
export const createActionClient = () => createServerActionClient({ cookies })
