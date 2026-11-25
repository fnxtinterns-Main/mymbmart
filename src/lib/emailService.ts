import '@/lib/envConfig';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// MegaBachatMart Central Mail Service
// Configured for Hostinger Business Mail (support@mymbmart.com)

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || 'support@mymbmart.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'MegaBachatMart Support <support@mymbmart.com>';
const IS_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;

let cachedTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (!process.env.SMTP_PASS) {
    console.warn('[EmailService] Notice: SMTP_PASS is not set in environment variables (.env). Outbound transactional emails will fail until configured.');
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: IS_SECURE, // true for 465, false for 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert rejections on shared hosting
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });
  }
  return cachedTransporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email using the central SMTP transporter
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getEmailTransporter();
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      html: options.html,
      replyTo: options.replyTo || SMTP_USER,
    });

    console.log(`[EmailService] Mail sent to ${options.to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EmailService] Failed to send email to ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send verification OTP to customer or partner
 */
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <tr>
                <td style="background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 28px 32px; text-align: center;">
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MegaBachatMart</h1>
                  <p style="color: #A7F3D0; margin: 6px 0 0 0; font-size: 13px;">Bachat Bhi. Kamai Bhi. Apni Community Ke Saath.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px;">
                  <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Your Login Verification Code</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Use the 6-digit verification code below to complete your login on MegaBachatMart.
                  </p>
                  
                  <div style="background-color: #F0FDF4; border: 2px dashed #86EFAC; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #064E3B; font-family: monospace;">${otp}</div>
                    <p style="color: #047857; font-size: 12px; font-weight: 600; margin: 8px 0 0 0;">Valid for 10 minutes only</p>
                  </div>

                  <p style="color: #64748B; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                    <strong>Security Notice:</strong> Never share this code with anyone, including MegaBachatMart employees. Our staff will never ask for your verification code.
                  </p>
                  <p style="color: #94A3B8; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                    If you did not request this verification code, please ignore this email or contact <a href="mailto:support@mymbmart.com" style="color: #047857;">support@mymbmart.com</a>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: `Your MegaBachatMart Login Code: ${otp}`,
    html,
  });

  return result.success;
}

/**
 * Send official approval email with Shop ID and temporary Password to newly approved merchant
 */
export async function sendPartnerApprovalEmail(params: {
  email: string;
  ownerName: string;
  shopName: string;
  shopId: string;
  password: string;
  pincode: string;
  portalUrl?: string;
}): Promise<boolean> {
  const portalUrl = params.portalUrl || 'https://partners.mymbmart.com';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <tr>
                <td style="background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 32px; text-align: center;">
                  <span style="background-color: #10B981; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">Partner Approved</span>
                  <h1 style="color: #FFFFFF; margin: 12px 0 4px 0; font-size: 24px; font-weight: 800;">Welcome to MegaBachatMart!</h1>
                  <p style="color: #A7F3D0; margin: 0; font-size: 14px;">Hyperlocal Merchant Partner Network</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px;">
                  <p style="color: #0F172A; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Namaste ${params.ownerName} ji,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Congratulations! Your store <strong style="color: #064E3B;">${params.shopName}</strong> has been officially approved as a verified Merchant Partner on MegaBachatMart for Pincode <strong>${params.pincode}</strong>.
                  </p>

                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 5px solid #10B981; border-radius: 10px; padding: 20px; margin: 0 0 24px 0;">
                    <h3 style="color: #064E3B; font-size: 15px; font-weight: 700; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Merchant Portal Login Details</h3>
                    <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #1E293B;">
                      <tr>
                        <td width="35%" style="color: #64748B;">Portal Link:</td>
                        <td><a href="${portalUrl}" style="color: #047857; font-weight: 700; text-decoration: underline;">${portalUrl}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #64748B;">Store ID / Username:</td>
                        <td><code style="background-color: #E2E8F0; color: #0F172A; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-family: monospace;">${params.shopId}</code></td>
                      </tr>
                      <tr>
                        <td style="color: #64748B;">Temporary Password:</td>
                        <td><code style="background-color: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-family: monospace;">${params.password}</code></td>
                      </tr>
                    </table>
                  </div>

                  <h3 style="color: #0F172A; font-size: 15px; font-weight: 700; margin: 0 0 10px 0;">Next Steps to Start Selling:</h3>
                  <ol style="color: #475569; font-size: 13px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 20px;">
                    <li>Log in to your merchant portal at <a href="${portalUrl}" style="color: #047857;"><strong>${portalUrl}</strong></a>.</li>
                    <li>Download the <strong>Bulk CSV Inventory Template</strong>.</li>
                    <li>Enter your products, stock quantities, and discounted Bachat prices.</li>
                    <li>Upload the CSV — your items will appear on the live storefront immediately!</li>
                  </ol>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${portalUrl}" style="background-color: #047857; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(4, 120, 87, 0.3);">
                      Open Partner Portal
                    </a>
                  </div>

                  <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 28px 0 0 0; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                    Need help? Contact our Partner Operations desk at <a href="mailto:support@mymbmart.com" style="color: #047857;">support@mymbmart.com</a> or call our toll-free helpline 1800-890-MBMART.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: params.email,
    subject: `🎉 Approved! Your MegaBachatMart Partner Account (${params.shopId}) is Ready`,
    html,
  });

  return result.success;
}
