export function welcomeTemplate(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.02em;">Axoniq<span style="color:#3b82f6;">.</span></h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;letter-spacing:-0.02em;">
                Bem-vindo ao Axoniq! 🎉
              </h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#71717a;">
                Olá <strong style="color:#18181b;">${userName}</strong>, sua conta foi criada com sucesso!
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#71717a;">
                Agora você pode fazer upload de documentos e gerar flashcards inteligentes com IA para otimizar seus estudos de medicina.
              </p>
              <div style="background:#f4f4f5;border-radius:8px;padding:20px;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#18181b;text-transform:uppercase;letter-spacing:0.05em;">
                  Primeiros passos:
                </p>
                <p style="margin:0;font-size:14px;line-height:1.8;color:#71717a;">
                  1. Faça upload de um PDF ou artigo<br>
                  2. A IA gera flashcards automaticamente<br>
                  3. Estude com repetição espaçada SM-2
                </p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;padding:12px 32px;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">
                Acessar Painel
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                © 2026 Axoniq. Todos os direitos reservados.
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
