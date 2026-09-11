export const emailHtml = (resetLink: string): string => `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#282a36;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#282a36;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#21222c;border:1px solid #44475a;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 28px;background-color:#191a21;border-bottom:1px solid #44475a;">
                <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6272a4;">Codeflix</p>
                <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#bd93f9;">Redefinir senha</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#f8f8f2;">
                  Recebemos um pedido para cadastrar uma nova senha da sua conta.
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#6272a4;">
                  Clique no botão abaixo. O link expira em 30 minutos. Se você não fez esse pedido, ignore este e-mail.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#bd93f9;">
                      <a href="${resetLink}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#282a36;text-decoration:none;">
                        Cadastrar nova senha
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#6272a4;">
                  Se o botão não funcionar, copie e cole este link no navegador:<br />
                  <a href="${resetLink}" style="color:#8be9fd;word-break:break-all;">${resetLink}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
