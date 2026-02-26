export type MetaEventPayload = {
  event_name: string
  event_source_url?: string
  custom_data?: Record<string, any>
  user?: { email?: string; phone?: string }
}

export async function trackMetaEvent(p: MetaEventPayload) {
  const event_id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString()
  const event_source_url = p.event_source_url ?? window.location.href

  window.fbq?.('track', p.event_name, p.custom_data ?? {}, { eventID: event_id })

  await fetch('/api/meta/capi', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...p, event_id, event_source_url }),
    keepalive: true,
  })

  return event_id
}