export function alphaInviteTemplate(email: string, tempPassword: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://axoniq.com.br'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    /* GMAIL DARK MODE FIX */
    @media (prefers-color-scheme: dark) {
      .body-bg { background-color: #0c0c0e !important; }
      .card-bg { background-color: #161618 !important; }
      .text-white { color: #ffffff !important; }
      .text-dim { color: #a1a1aa !important; }
      .credentials-bg { background-color: #0c0c0e !important; }
    }
    /* OUTLOOK DARK MODE FIX */
    [data-ogsc] .body-bg { background-color: #0c0c0e !important; }
    [data-ogsc] .card-bg { background-color: #161618 !important; }
    [data-ogsc] .text-white { color: #ffffff !important; }
    [data-ogsc] .text-dim { color: #a1a1aa !important; }
    [data-ogsc] .credentials-bg { background-color: #0c0c0e !important; }
  </style>
</head>
<body class="body-bg" style="margin:0;padding:0;background-color:#0c0c0e;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="body-bg" style="background-color:#0c0c0e;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" class="card-bg" style="max-width:600px;background-color:#161618;border-radius:24px;border:1px solid #27272a;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <!-- Header/Logo -->
          <tr>
            <td style="padding:48px 40px 0;text-align:center;">
              <h1 class="text-white" style="margin:0;font-size:24px;color:#ffffff;letter-spacing:-0.05em;font-weight:800;">
                Axoniq<span style="color:#3b82f6;">.</span>
              </h1>
              <div style="height:1px;width:40px;background-color:#3b82f6;margin:20px auto 0;opacity:0.5;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:32px;">
                <h2 class="text-white" style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;line-height:1.2;">
                  Seu Acesso Alpha Chegou!
                </h2>
                <p class="text-dim" style="margin:0;font-size:16px;line-height:1.6;color:#a1a1aa;">
                  Você foi selecionado para experimentar o futuro da educação médica com inteligência artificial.
                </p>
              </div>

              <!-- VIP Badge/Notice -->
              <div style="background-color:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:16px;padding:20px;text-align:center;margin-bottom:32px;">
                <p style="margin:0;font-size:14px;color:#60a5fa;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                  🔐 ACESSO TOTAL LIBERADO PARA TESTES
                </p>
              </div>

              <!-- Credentials Box -->
              <div class="credentials-bg" style="background-color:#0c0c0e;border:1px solid #27272a;border-radius:16px;padding:24px;margin-bottom:40px;">
                <p style="margin:0 0 16px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;font-weight:700;">Suas Credenciais Temporárias</p>
                <div style="margin-bottom:12px;">
                  <span style="font-size:14px;color:#71717a;">Email:</span>
                  <span class="text-white" style="font-size:14px;color:#ffffff;font-weight:600;margin-left:8px;">${email}</span>
                </div>
                <div>
                  <span style="font-size:14px;color:#71717a;">Senha:</span>
                  <code style="background-color:#27272a;padding:4px 8px;border-radius:6px;color:#60a5fa;font-family:monospace;font-size:15px;margin-left:8px;font-weight:700;">${tempPassword}</code>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${siteUrl}/login" style="display:inline-block;padding:18px 40px;background-color:#3b82f6;color:white;font-weight:800;text-decoration:none;border-radius:16px;font-size:16px;letter-spacing:-0.01em;box-shadow:0 10px 20px rgba(59,130,246,0.3);">
                  Entrar no Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding:0 40px 48px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
                Axoniq Alpha • Bio-Feedback Intelligence
              </p>
              <p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#3f3f46;">
                Você recebeu este convite especial por ser um membro selecionado para a fase Alpha do Axoniq.<br>
                Este email foi enviado para <b>${email}</b>.
              </p>
              <div style="height:1px;width:30px;background-color:#27272a;margin:20px auto;"></div>
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                © 2026 AxonIQ Platform. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
