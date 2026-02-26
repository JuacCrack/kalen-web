import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex')
const normEmail = (v: string) => v.trim().toLowerCase()
const normPhone = (v: string) => v.replace(/[^\d]/g, '')
const firstIp = (v: string | null) => (v ? v.split(',')[0].trim() : undefined)

export async function POST(req: Request) {
  const access_token = process.env.META_CAPI_ACCESS_TOKEN
  const dataset_id = process.env.META_DATASET_ID
  if (!access_token || !dataset_id) return NextResponse.json({ ok: false, error: 'Missing META_CAPI_ACCESS_TOKEN or META_DATASET_ID' }, { status: 500 })

  const h = await headers()
  const c = await cookies()

  const ua = h.get('user-agent') ?? undefined
  const ip = firstIp(h.get('x-forwarded-for')) ?? h.get('x-real-ip') ?? undefined
  const fbp = c.get('_fbp')?.value
  const fbc = c.get('_fbc')?.value

  const body = await req.json().catch(() => ({} as any))
  const event_name = body?.event_name
  const event_id = body?.event_id
  const event_source_url = body?.event_source_url
  const custom_data = body?.custom_data ?? {}
  const user = body?.user ?? {}

  if (!event_name || !event_id || !event_source_url) return NextResponse.json({ ok: false, error: 'Missing event_name/event_id/event_source_url' }, { status: 400 })

  const em = user.email ? [sha256(normEmail(user.email))] : undefined
  const ph = user.phone ? [sha256(normPhone(user.phone))] : undefined

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        action_source: 'website',
        event_source_url,
        user_data: {
          ...(em ? { em } : {}),
          ...(ph ? { ph } : {}),
          ...(ip ? { client_ip_address: ip } : {}),
          ...(ua ? { client_user_agent: ua } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
        custom_data,
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  }

  const url = `https://graph.facebook.com/v20.0/${dataset_id}/events?access_token=${encodeURIComponent(access_token)}`
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const json = await r.json().catch(() => ({}))

  return NextResponse.json({ ok: r.ok, meta: json }, { status: r.ok ? 200 : 400 })
}