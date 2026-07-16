// Supabase Edge Function — invia l'email di conferma prenotazione via Resend.
// Innescata da un Database Webhook su INSERT in tms.reservations
// (configurato dal Dashboard Supabase: Database -> Webhooks).
//
// Variabili d'ambiente richieste (Project Settings -> Edge Functions -> Secrets):
// - RESEND_API_KEY
// - RESEND_FROM_EMAIL (es. "Il Mio Ristorante <prenotazioni@tuodominio.it>")
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono già disponibili automaticamente
// nell'ambiente delle Edge Function, non vanno impostate a mano.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { db: { schema: 'tms' } }
)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  })
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const reservation = payload.record

    if (!reservation?.customer_email) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const { data: restaurant } = await supabaseAdmin
      .from('restaurants')
      .select('name, address')
      .eq('id', reservation.restaurant_id)
      .single()

    const restaurantName = restaurant?.name ?? 'il ristorante'

    const emailBody = `
      <p>Ciao ${reservation.customer_name},</p>
      <p>La tua prenotazione da <strong>${restaurantName}</strong> è confermata:</p>
      <ul>
        <li><strong>Data e ora:</strong> ${formatDateTime(reservation.arrival_time)}</li>
        <li><strong>Persone:</strong> ${reservation.party_size}</li>
        ${restaurant?.address ? `<li><strong>Indirizzo:</strong> ${restaurant.address}</li>` : ''}
      </ul>
      ${reservation.notes ? `<p>Note: ${reservation.notes}</p>` : ''}
      <p>A presto!</p>
    `

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY non configurata: email non inviata.')
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY missing' }), { status: 500 })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: reservation.customer_email,
        subject: `Prenotazione confermata da ${restaurantName}`,
        html: emailBody,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      console.error('Errore invio email Resend:', errText)
      return new Response(JSON.stringify({ error: errText }), { status: 500 })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
