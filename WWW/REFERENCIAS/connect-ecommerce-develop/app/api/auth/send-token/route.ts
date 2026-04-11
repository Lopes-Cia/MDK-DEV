import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getAuthWebserviceBaseUrl } from '@/lib/auth/externalApi'
import { ensureAuthReady } from '@/lib/integration/authService'
import { fetchWithRetry, readResponseData } from '@/lib/integration/network'
import { toRawToken } from '@/lib/integration/token'

const sendTokenBodySchema = z
  .object({
    email: z.string().trim().email().optional(),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\d{10,15}$/, 'WhatsApp inválido')
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasEmail = Boolean(data.email)
    const hasWhatsapp = Boolean(data.whatsapp)
    if (!hasEmail && !hasWhatsapp) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe email ou whatsapp para enviar o token.',
        path: ['email'],
      })
      return
    }
    if (hasEmail && hasWhatsapp) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe apenas um canal (email ou whatsapp).',
        path: ['email'],
      })
    }
  })



export async function POST(request: Request) {
  try {
    const bodyRaw = await request.json()
    const parsed = sendTokenBodySchema.safeParse(bodyRaw)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
        },
        {
          status: 400,
        }
      )
    }

    const email = parsed.data.email ?? ''
    const whatsapp = parsed.data.whatsapp ?? ''

    const query = new URLSearchParams()
    if (email) {
      query.set('email', email)
    } else {
      query.set('whatsapp', whatsapp)
    }

    const url = `${getAuthWebserviceBaseUrl()}/enviarToken?${query.toString()}`
    const auth = await ensureAuthReady({ backgroundRefresh: false })
    const authHeader = toRawToken(auth.token.hashToken)

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      },
      {
        maxAttempts: 3,
      }
    )

    const data = await readResponseData<unknown>(response)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Falha ao enviar token de acesso.',
          data,
        },
        {
          status: response.status,
        }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected send-token error'

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    )
  }
}
