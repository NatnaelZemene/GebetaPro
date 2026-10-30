/**
 * email.service.js — Email delivery service using nodemailer.
 *
 * Handles SMTP configuration, branded HTML email templates, and delivery.
 * Separated from business logic for testability and reusability.
 */
import nodemailer from 'nodemailer'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

const APP_NAME   = 'GebetaPro'
const BRAND_COLOR = '#1a6b5e'   // matches --color-brand in the frontend theme
const BRAND_HOVER = '#155a4e'

// ── SMTP Transport Setup ─────────────────────────────────────────────────────

let transporter = null

/**
 * Reset the cached transporter — called when env vars change (tests/hot-reload).
 * Also allows fresh transporter after config update.
 */
export function resetTransporter() {
  transporter = null
}

function getTransporter() {
  if (!transporter) {
    const smtpConfig = {
      host:            config.smtp.host,
      port:            config.smtp.port,
      secure:          config.smtp.secure,   // true for port 465 (SSL), false for 587 (STARTTLS)
      connectionTimeout: 10_000,             // 10 s — fail fast instead of hanging
      greetingTimeout:   8_000,
      socketTimeout:    15_000,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    }

    // Brevo SMTP on port 587 requires STARTTLS — enforce it explicitly
    // so nodemailer doesn't downgrade to an unencrypted connection.
    if (!config.smtp.secure && config.smtp.port === 587) {
      smtpConfig.requireTLS = true
    }

    transporter = nodemailer.createTransport(smtpConfig)
  }
  return transporter
}

// ── Shared layout wrapper ────────────────────────────────────────────────────

/**
 * Wrap email body content in the shared GebetaPro layout.
 * @param {string} title    — <title> tag text
 * @param {string} body     — inner HTML (everything inside the card)
 * @returns {string} Complete HTML document
 */
function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #faf9f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1a1917;
      padding: 40px 16px;
    }
    .wrapper { max-width: 560px; margin: 0 auto; }
    .logo {
      text-align: center;
      margin-bottom: 28px;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #1a1917;
    }
    .logo span { color: ${BRAND_COLOR}; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e4e2dd;
      padding: 40px 36px;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1a1917;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    p { color: #5a5853; margin-bottom: 16px; font-size: 14px; }
    p:last-child { margin-bottom: 0; }
    .cta-wrap { text-align: center; margin: 28px 0; }
    .cta {
      display: inline-block;
      background: ${BRAND_COLOR};
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 10px;
      letter-spacing: 0.01em;
    }
    .url-fallback {
      background: #f5f4f1;
      border: 1px solid #e4e2dd;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      word-break: break-all;
      color: ${BRAND_COLOR};
      margin: 16px 0;
    }
    .notice {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      font-size: 13px;
      color: #92600a;
      margin: 20px 0;
    }
    .divider {
      border: none;
      border-top: 1px solid #e4e2dd;
      margin: 28px 0 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9b9890;
      margin-top: 24px;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">Gebeta<span>Pro</span></div>
    <div class="card">
      ${body}
      <hr class="divider" />
      <p style="font-size:12px;color:#9b9890;">
        This is an automated email from ${APP_NAME}. Please do not reply.<br/>
        If you need help, contact our support team.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ${APP_NAME} · Ethiopia's discovery platform
    </div>
  </div>
</body>
</html>`
}

// ── Templates ────────────────────────────────────────────────────────────────

function verificationTemplate(verificationUrl, expirationHours) {
  return layout('Verify your email — GebetaPro', `
    <h2>Verify your email address</h2>
    <p>
      Welcome to <strong>${APP_NAME}</strong>! One quick step before you get started —
      please confirm your email address so we know it's really you.
    </p>
    <div class="cta-wrap">
      <a href="${verificationUrl}" class="cta">Verify my email</a>
    </div>
    <p style="font-size:13px;color:#9b9890;margin-bottom:8px;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <div class="url-fallback">${verificationUrl}</div>
    <div class="notice">
      ⏱ This link expires in <strong>${expirationHours} hours</strong>.
      If it expires, you can request a new one from the verification page.
    </div>
    <p style="font-size:13px;color:#9b9890;">
      If you didn't create a ${APP_NAME} account, you can safely ignore this email.
    </p>
  `)
}

function passwordResetTemplate(resetUrl, expirationHours) {
  return layout('Reset your password — GebetaPro', `
    <h2>Reset your password</h2>
    <p>
      We received a request to reset the password for your <strong>${APP_NAME}</strong> account.
      Click the button below to choose a new password.
    </p>
    <div class="cta-wrap">
      <a href="${resetUrl}" class="cta">Reset my password</a>
    </div>
    <p style="font-size:13px;color:#9b9890;margin-bottom:8px;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <div class="url-fallback">${resetUrl}</div>
    <div class="notice">
      ⏱ This link expires in <strong>${expirationHours} hour${expirationHours !== 1 ? 's' : ''}</strong>.
      After that, you'll need to request a new reset link.
    </div>
    <p style="font-size:13px;color:#9b9890;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not be changed.
    </p>
  `)
}

// ── Multi-Platform Email Delivery (Node.js & Cloudflare Workers) ────────────

/**
 * Send an email via Cloudflare Worker's raw TLS TCP socket (port 465).
 */
async function sendViaCloudflareSocket({ host, port = 465, user, pass, from, to, subject, html }) {
  const { connect } = await import('cloudflare:sockets')
  const socket = connect({ hostname: host, port: Number(port) }, { secureTransport: 'on' })

  const reader = socket.readable.getReader()
  const writer = socket.writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let buffer = ''
  async function readLine() {
    while (!buffer.includes('\n')) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
    }
    const idx = buffer.indexOf('\n')
    if (idx === -1) {
      const line = buffer
      buffer = ''
      return line
    }
    const line = buffer.slice(0, idx + 1)
    buffer = buffer.slice(idx + 1)
    return line
  }

  async function expectReply(expectedPrefixes) {
    let lastLine = ''
    while (true) {
      const line = await readLine()
      lastLine = line
      // Standard SMTP replies start with a 3-digit code followed by space or hyphens
      if (/^\d{3} /.test(line) || /^\d{3}$/.test(line.trim())) {
        break
      }
    }
    const code = lastLine.slice(0, 3)
    if (!expectedPrefixes.includes(code)) {
      throw new Error(`SMTP error (${code}): ${lastLine.trim()}`)
    }
    return lastLine
  }

  async function sendCmd(cmd) {
    await writer.write(encoder.encode(cmd + '\r\n'))
  }

  try {
    await expectReply(['220'])
    await sendCmd('EHLO localhost')
    await expectReply(['250'])
    await sendCmd('AUTH LOGIN')
    await expectReply(['334'])
    await sendCmd(btoa(user))
    await expectReply(['334'])
    await sendCmd(btoa(pass))
    await expectReply(['235'])
    await sendCmd(`MAIL FROM:<${from}>`)
    await expectReply(['250'])
    await sendCmd(`RCPT TO:<${to}>`)
    await expectReply(['250'])
    await sendCmd('DATA')
    await expectReply(['354'])

    const rawEmail = [
      `From: "${APP_NAME}" <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      '.',
    ].join('\r\n')

    await writer.write(encoder.encode(rawEmail + '\r\n'))
    await expectReply(['250'])

    await sendCmd('QUIT')
    try { await expectReply(['221']) } catch {}

    logger.info({ recipientDomain: to?.split('@')[1] }, 'Email sent successfully via Cloudflare Worker SMTP socket')
    return true
  } finally {
    try { reader.releaseLock() } catch {}
    try { writer.releaseLock() } catch {}
    try { await socket.close() } catch {}
  }
}

/**
 * Send an email via Resend HTTP API (works across all platforms).
 */
async function sendViaResend({ to, subject, html }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.smtp.from.includes('<') ? config.smtp.from : `"${APP_NAME}" <${config.smtp.from}>`,
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend API HTTP ${res.status}: ${errText}`)
    }
    const data = await res.json()
    logger.info({ messageId: data.id, recipientDomain: to?.split('@')[1] }, 'Email sent successfully via Resend API')
    return true
  } catch (err) {
    logger.error({ error: err.message, recipientDomain: to?.split('@')[1] }, 'Failed to send email via Resend API')
    return false
  }
}

/**
 * Send an email via Brevo HTTP API (works across all platforms).
 */
async function sendViaBrevo({ to, subject, html }) {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': config.brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: APP_NAME, email: config.smtp.from },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API HTTP ${res.status}: ${errText}`)
    }
    const data = await res.json()
    logger.info({ messageId: data.messageId, recipientDomain: to?.split('@')[1] }, 'Email sent successfully via Brevo API')
    return true
  } catch (err) {
    logger.error({ error: err.message, recipientDomain: to?.split('@')[1] }, 'Failed to send email via Brevo API')
    return false
  }
}

/**
 * Universal email dispatcher: routes to Resend, Brevo, Cloudflare Sockets, or Nodemailer.
 */
async function deliverEmail({ to, subject, html }) {
  // Option 1: Resend HTTP API
  if (config.resendApiKey) {
    return sendViaResend({ to, subject, html })
  }

  // Option 2: Brevo HTTP API
  if (config.brevoApiKey) {
    return sendViaBrevo({ to, subject, html })
  }

  // Option 3: SMTP Credentials configured
  if (config.smtp.user && config.smtp.password) {
    const isCloudflare = Boolean(process.env.CLOUDFLARE_WORKER || process.env.CLOUDFLARE_HYPERDRIVE)

    if (isCloudflare) {
      try {
        return await sendViaCloudflareSocket({
          host: config.smtp.host || 'smtp.gmail.com',
          port: config.smtp.port === 587 ? 465 : (config.smtp.port || 465),
          user: config.smtp.user,
          pass: config.smtp.password,
          from: config.smtp.from,
          to,
          subject,
          html,
        })
      } catch (err) {
        logger.error(
          {
            recipientDomain: to?.split('@')[1] || 'unknown',
            smtpHost: config.smtp.host,
            error: err.message,
          },
          'Cloudflare Worker SMTP socket delivery failed',
        )
        return false
      }
    }

    // Standard Node.js environment — use Nodemailer
    try {
      const info = await getTransporter().sendMail({
        from: `"${APP_NAME}" <${config.smtp.from}>`,
        to,
        subject,
        html,
      })
      logger.info(
        { messageId: info.messageId, recipientDomain: to?.split('@')[1] },
        'Email sent successfully via Nodemailer SMTP',
      )
      return true
    } catch (err) {
      logger.error(
        {
          recipientDomain: to?.split('@')[1] || 'unknown',
          smtpHost: config.smtp.host,
          smtpPort: config.smtp.port,
          errorCode: err.code,
          errorMessage: err.message,
          response: err.response,
        },
        'Nodemailer SMTP delivery failed',
      )
      return false
    }
  }

  logger.warn(
    { recipientDomain: to?.split('@')[1] || 'unknown' },
    'Email delivery skipped: No email credentials configured (SMTP_USER/SMTP_PASSWORD, RESEND_API_KEY, or BREVO_API_KEY)',
  )
  return false
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a verification email to the user.
 * Returns true on success, false on failure.
 */
export async function sendVerificationEmail({ to, verificationUrl, expirationHours }) {
  const html = verificationTemplate(verificationUrl, Number(expirationHours) || 24)
  const subject = `Verify your email — ${APP_NAME}`
  return deliverEmail({ to, subject, html })
}

/**
 * Send a password reset email to the user.
 * Returns true on success, false on failure.
 */
export async function sendPasswordResetEmail({ to, resetUrl, expirationHours }) {
  const html = passwordResetTemplate(resetUrl, Number(expirationHours) || 1)
  const subject = `Reset your password — ${APP_NAME}`
  return deliverEmail({ to, subject, html })
}

/**
 * Verify SMTP connection is working (used for health checks).
 */
export async function verifySmtpConnection() {
  if (config.resendApiKey || config.brevoApiKey) {
    logger.info('HTTP email API configured and ready')
    return true
  }

  const isCloudflare = Boolean(process.env.CLOUDFLARE_WORKER || process.env.CLOUDFLARE_HYPERDRIVE)
  if (isCloudflare) {
    // In Cloudflare Workers, check that credentials exist
    return Boolean(config.smtp.user && config.smtp.password)
  }

  try {
    await getTransporter().verify()
    logger.info('SMTP connection verified')
    return true
  } catch (err) {
    logger.error({ error: err.message }, 'SMTP connection verification failed')
    return false
  }
}
