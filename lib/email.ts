export function getVerificationEmailHTML(otpCode: string): string {
  // Get base URL from environment or use default
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "https://e-learning.darelkubra.com";
  const logoUrl = `${baseUrl}/darulkubra.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - Darulkubra</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f9ff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f9ff; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header with Logo and Sky Blue Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%); padding: 40px 30px; text-align: center;">
              <!-- Logo -->
              <img src="${logoUrl}" alt="Darulkubra Logo" style="max-width: 120px; height: auto; margin: 0 auto 20px; display: block; background-color: transparent;" />
              <p style="margin: 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">
                Email Verification
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px; font-weight: 600; line-height: 1.6;">
                Aselamualeykum! 👋
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.8;">
                Thank you for choosing Darulkubra! To complete your registration, please use the verification code below:
              </p>
              
              <!-- OTP Code Box -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%); border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);">
                      <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.95); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                      </p>
                      <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                        ${otpCode}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Message -->
              <div style="background-color: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; border-radius: 6px; margin: 30px 0;">
                <p style="margin: 0; color: #c53030; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Darulkubra staff will never ask for your verification code.
                </p>
              </div>
              
              <!-- Instructions -->
              <p style="margin: 30px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.8;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
              
              <!-- Amharic Section -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0;">
                <p style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px; font-weight: 600; line-height: 1.6;">
                  አሰላሙዓለይኩም! 👋
                </p>
                
                <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.8;">
                  ዳሩልኩብራን ስለመረጡ እናመሰግናለን! ምዝገባዎን ለማጠናቀቅ እባክዎን ከዚህ በታች ያለውን ማረጋገጫ ኮድ ይጠቀሙ።
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 6px; margin: 30px 0;">
                  <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.6;">
                    <strong>⚠️ ደህንነት ማስታወሻ:</strong> ይህንን ኮድ ከማንም ጋር አያጋሩ። የዳሩልኩብራ ሰራተኞች ማረጋገጫ ኮድዎን አይጠይቁም።
                  </p>
                </div>
                
                <p style="margin: 30px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.8;">
                  ይህ ኮድ በ<strong>10 ደቂቃዎች</strong> ውስጥ ይዝጋል። ይህንን ኮድ ካልጠየቁ፣ እባክዎን ይህንን ኢሜይል ችላ ይበሉ።
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Need help? Contact us at 
                <a href="mailto:support@darulkubra.com" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">support@darulkubra.com</a>
              </p>
              <p style="margin: 15px 0 0 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                © ${new Date().getFullYear()} Darulkubra. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px; line-height: 1.6;">
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getVerificationEmailText(otpCode: string): string {
  return `
Aselamualeykum!

Your one-time verification code is: ${otpCode}

Do not share this code with anyone.

Thank you for choosing Darulkubra!

---

አሰላሙዓለይኩም!

የእርስዎ የአንድ ጊዜ ማረጋገጫ ኮድ: ${otpCode}

ይህንን ኮድ ከማንም ጋር አያጋሩ።

ዳሩልኩብራን ስለመረጡ እናመሰግናለን!
  `.trim();
}
