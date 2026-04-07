export function passwordResetTemplate(resetLink: string): string {
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
    @media (prefers-color-scheme: dark) {
      .body-bg { background-color: #0c0c0e !important; }
      .card-bg { background-color: #161618 !important; }
      .text-white { color: #ffffff !important; }
      .text-dim { color: #a1a1aa !important; }
    }
    [data-ogsc] .body-bg { background-color: #0c0c0e !important; }
    [data-ogsc] .card-bg { background-color: #161618 !important; }
    [data-ogsc] .text-white { color: #ffffff !important; }
    [data-ogsc] .text-dim { color: #a1a1aa !important; }
  </style>
</head>
<body class="body-bg" style="margin:0;padding:0;background-color:#0c0c0e;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="body-bg" style="background-color:#0c0c0e;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" class="card-bg" style="max-width:500px;background-color:#161618;border-radius:24px;border:1px solid #27272a;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <!-- Header/Logo -->
          <tr>
            <td style="padding:40px 40px 0;">
              <h1 class="text-white" style="margin:0;font-size:22px;color:#ffffff;letter-spacing:-0.05em;font-weight:800;">
                Axoniq<span style="color:#3b82f6;">.</span>
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 class="text-white" style="margin:0 0 16px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">
                Recuperar sua senha
              </h2>
              <p class="text-dim" style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha com segurança.
              </p>
              
              <div style="text-align:left;">
                <a href="${resetLink}" style="display:inline-block;padding:16px 32px;background-color:#3b82f6;color:white;font-weight:700;text-decoration:none;border-radius:12px;font-size:14px;letter-spacing:0.02em;">
                  Redefinir Senha
                </a>
              </div>

              <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#52525b;">
                Se você não solicitou essa alteração, ignore este email. Este link expirará em breve por motivos de segurança.
              </p>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding:24px 40px;background-color:#0c0c0e;border-top:1px solid #27272a;">
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
