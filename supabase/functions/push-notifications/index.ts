/// <reference path="../types.d.ts" />

import { createClient } from "@supabase/supabase-js"

Deno.serve(async (req: Request) => {
  try {
    const { record, table, type } = await req.json()

    // Handle new messages
    if (table === 'messages' && type === 'INSERT') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Get receiver's push token
      const { data: user } = await supabase
        .from('users')
        .select('push_token, full_name')
        .eq('id', record.receiver_id)
        .single()

      if (user?.push_token) {
        // Send to Expo Push Service
        const message = {
          to: user.push_token,
          sound: 'default',
          title: `New message from ${record.sender_name || 'Someone'}`,
          body: record.text,
          data: { chatId: record.chat_id, type: 'message' },
        }

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
      }
    }

    // Handle system notifications (verifications, payouts, etc.)
    if (table === 'notifications' && type === 'INSERT') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: user } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', record.user_id)
        .single()

      if (user?.push_token) {
        const message = {
          to: user.push_token,
          sound: 'default',
          title: record.title,
          body: record.message,
          data: { ...record.metadata, type: record.type },
        }

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
