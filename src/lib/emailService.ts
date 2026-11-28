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
    const plainFallback =
      options.text ||
      options.html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&middot;/g, '·')
        .replace(/&rarr;/g, '->')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: plainFallback,
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
 * Shared branded HTML shell matching MegaBachatMart's Forest Green, Fresh Green, Mint & Saffron Orange palette
 */
export function buildBrandEmailLayout(params: {
  badge?: string;
  title: string;
  subtitle?: string;
  preheader?: string;
  bodyHtml: string;
}): string {
  const logoUrl = 'https://mymbmart.com/images/LOgo.jpeg';
  const preheaderText = params.preheader || `${params.title} — MegaBachatMart`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F2FBF6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0F172A;">
      <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #F2FBF6; opacity: 0;">${preheaderText}</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F2FBF6; padding: 32px 12px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #D1FAE5; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.08);">
              <!-- Top Brand Accent Strip -->
              <tr>
                <td style="height: 6px; background: linear-gradient(90deg, #064E3B 0%, #16A34A 55%, #FF5722 100%); font-size: 0; line-height: 0;"></td>
              </tr>

              <!-- White Logo Header (Matches Site Navbar) -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 24px 32px 20px 32px; text-align: center; border-bottom: 1px solid #E6F7EE;">
                  <a href="https://mymbmart.com" style="text-decoration: none; display: inline-block;">
                    <img src="${logoUrl}" alt="MegaBachatMart - My Mega Bachat Mart" width="220" style="display: block; max-width: 220px; width: 100%; height: auto; margin: 0 auto; border: 0;" />
                  </a>
                </td>
              </tr>

              <!-- Forest Green Hero Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #064E3B 0%, #15803D 100%); padding: 24px 32px; text-align: center;">
                  ${params.badge ? `
                  <div style="margin-bottom: 10px;">
                    <span style="display: inline-block; background-color: #FF5722; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; padding: 5px 14px; border-radius: 999px; text-transform: uppercase;">${params.badge}</span>
                  </div>
                  ` : ''}
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; line-height: 1.3;">${params.title}</h1>
                  ${params.subtitle ? `<p style="color: #E6F7EE; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">${params.subtitle}</p>` : ''}
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 32px;">
                  ${params.bodyHtml}
                </td>
              </tr>

              <!-- Branded Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 20px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #064E3B;">
                    MegaBachatMart &middot; <span style="color: #FF5722;">Bachat Bhi. Kamai Bhi.</span>
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #64748B; line-height: 1.6;">
                    Need help? Write to <a href="mailto:support@mymbmart.com" style="color: #16A34A; font-weight: 600; text-decoration: none;">support@mymbmart.com</a> or visit <a href="https://mymbmart.com" style="color: #064E3B; font-weight: 600; text-decoration: none;">mymbmart.com</a>
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
}

/**
 * Send verification OTP to customer or partner
 */
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const html = buildBrandEmailLayout({
    badge: 'Verification Code',
    title: 'Verify Your Email Address',
    subtitle: 'Bachat Bhi. Kamai Bhi. Apni Community Ke Saath.',
    preheader: `Your MegaBachatMart verification code is ${otp}. Valid for 15 minutes.`,
    bodyHtml: `
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
        Use the 6-digit one-time verification code below to verify your email on <strong style="color: #064E3B;">MegaBachatMart</strong>.
      </p>

      <div style="background-color: #F2FBF6; border: 2px dashed #16A34A; border-radius: 16px; padding: 24px 20px; text-align: center; margin: 0 0 24px 0;">
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #064E3B; font-family: 'Courier New', Courier, monospace; padding-left: 10px;">${otp}</div>
        <div style="margin-top: 12px;">
          <span style="display: inline-block; background-color: #FFF3EE; color: #E64A19; border: 1px solid #FFCCBC; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px;">
            Valid for 15 minutes
          </span>
        </div>
      </div>

      <div style="background-color: #FFF3EE; border-left: 4px solid #FF5722; border-radius: 10px; padding: 14px 16px; margin: 0 0 18px 0;">
        <p style="color: #334155; font-size: 12px; line-height: 1.6; margin: 0;">
          <strong style="color: #0F172A;">Security Notice:</strong> Never share this code with anyone, including MegaBachatMart staff. We will never ask you for your OTP.
        </p>
      </div>

      <p style="color: #64748B; font-size: 12px; line-height: 1.6; margin: 0;">
        If you did not request this code, you can safely ignore this email.
      </p>
    `,
  });

  const result = await sendEmail({
    to: email,
    subject: `Your MegaBachatMart Verification Code: ${otp}`,
    text: `Your MegaBachatMart verification code is ${otp}. Valid for 15 minutes. Never share this code with anyone.`,
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

  const html = buildBrandEmailLayout({
    badge: 'Partner Approved',
    title: 'Welcome to MegaBachatMart!',
    subtitle: 'Hyperlocal Merchant Partner Network',
    preheader: `Congratulations! ${params.shopName} has been approved as a MegaBachatMart Partner (${params.shopId}).`,
    bodyHtml: `
      <p style="color: #0F172A; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Namaste ${params.ownerName} ji,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.65; margin: 0 0 22px 0;">
        Congratulations! Your store <strong style="color: #064E3B;">${params.shopName}</strong> has been officially approved as a verified Merchant Partner on MegaBachatMart for Pincode <strong style="color: #064E3B;">${params.pincode}</strong>.
      </p>

      <div style="background-color: #F2FBF6; border: 1px solid #BBF7D0; border-left: 5px solid #16A34A; border-radius: 14px; padding: 20px; margin: 0 0 24px 0;">
        <h3 style="color: #064E3B; font-size: 13px; font-weight: 800; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.6px;">Your Merchant Portal Login Details</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #1E293B;">
          <tr>
            <td width="38%" style="color: #475569; font-weight: 600;">Portal Link:</td>
            <td><a href="${portalUrl}" style="color: #16A34A; font-weight: 700; text-decoration: underline;">${portalUrl}</a></td>
          </tr>
          <tr>
            <td style="color: #475569; font-weight: 600;">Store ID / Username:</td>
            <td><code style="background-color: #FFFFFF; border: 1px solid #CBD5E1; color: #064E3B; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-family: 'Courier New', monospace;">${params.shopId}</code></td>
          </tr>
          <tr>
            <td style="color: #475569; font-weight: 600;">Temporary Password:</td>
            <td><code style="background-color: #FFF3EE; border: 1px solid #FFCCBC; color: #E64A19; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-family: 'Courier New', monospace;">${params.password}</code></td>
          </tr>
        </table>
      </div>

      <h3 style="color: #0F172A; font-size: 14px; font-weight: 800; margin: 0 0 10px 0;">Next Steps to Start Selling:</h3>
      <ol style="color: #334155; font-size: 13px; line-height: 1.85; margin: 0 0 26px 0; padding-left: 20px;">
        <li>Log in to your merchant portal at <a href="${portalUrl}" style="color: #16A34A; font-weight: 700;">${portalUrl}</a>.</li>
        <li>Download the <strong>Bulk CSV Inventory Template</strong> or add products with photos.</li>
        <li>Enter your products, stock quantities, and discounted Bachat prices.</li>
        <li>Publish your items — they will appear on the live storefront immediately!</li>
      </ol>

      <div style="text-align: center; margin: 26px 0 8px 0;">
        <a href="${portalUrl}" style="background-color: #FF5722; color: #FFFFFF; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 999px; display: inline-block; box-shadow: 0 6px 14px -2px rgba(255, 87, 34, 0.35);">
          Open Partner Portal &rarr;
        </a>
      </div>
    `,
  });

  const result = await sendEmail({
    to: params.email,
    subject: `Approved! Your MegaBachatMart Partner Account (${params.shopId}) is Ready`,
    html,
  });

  return result.success;
}

/**
 * Send polite, professional rejection email with specific reason and reapply instructions
 */
export async function sendPartnerRejectionEmail(params: {
  email: string;
  ownerName: string;
  shopName: string;
  applicationNumber?: string;
  reason: string;
  registerUrl?: string;
}): Promise<boolean> {
  const registerUrl = params.registerUrl || 'https://mymbmart.com/shop/register';
  const appRef = params.applicationNumber ? ` (Application #${params.applicationNumber})` : '';
  const safeReasonLines = params.reason
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

  const reasonHtml =
    safeReasonLines.length > 1
      ? `<ul style="color: #0F172A; font-size: 14px; font-weight: 600; line-height: 1.7; margin: 0; padding-left: 18px;">${safeReasonLines.map((l) => `<li>${l}</li>`).join('')}</ul>`
      : `<p style="color: #0F172A; font-size: 14px; font-weight: 600; line-height: 1.6; margin: 0;">${safeReasonLines[0] || ''}</p>`;

  const html = buildBrandEmailLayout({
    badge: 'Application Update',
    title: 'Update on Your Partner Application',
    subtitle: 'MegaBachatMart Merchant Onboarding Desk',
    preheader: `Update regarding your MegaBachatMart partner application for ${params.shopName}.`,
    bodyHtml: `
      <p style="color: #0F172A; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Namaste ${params.ownerName} ji,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.65; margin: 0 0 20px 0;">
        Thank you for your interest in partnering with <strong style="color: #064E3B;">MegaBachatMart</strong> for <strong style="color: #064E3B;">${params.shopName}</strong>${appRef}. After carefully reviewing your submission, we regret to inform you that your partner application could not be approved at this time.
      </p>

      <div style="background-color: #FFF3EE; border: 1px solid #FFCCBC; border-left: 5px solid #FF5722; border-radius: 14px; padding: 18px 20px; margin: 0 0 22px 0;">
        <h3 style="color: #E64A19; font-size: 12px; font-weight: 800; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.6px;">Reason for Rejection</h3>
        ${reasonHtml}
      </div>

      <div style="background-color: #F2FBF6; border: 1px solid #BBF7D0; border-radius: 14px; padding: 16px 20px; margin: 0 0 24px 0;">
        <p style="color: #064E3B; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">What You Can Do Next:</p>
        <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0;">
          Please review the reason noted above, update the required details or documents, and submit a fresh application. Our onboarding team will be glad to re-evaluate your store.
        </p>
      </div>

      <div style="text-align: center; margin: 24px 0 8px 0;">
        <a href="${registerUrl}" style="background-color: #064E3B; color: #FFFFFF; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 999px; display: inline-block; box-shadow: 0 6px 14px -2px rgba(6, 78, 59, 0.25);">
          Review &amp; Reapply as Partner &rarr;
        </a>
      </div>
    `,
  });

  const result = await sendEmail({
    to: params.email,
    subject: `Update on Your MegaBachatMart Partner Application${appRef}`,
    html,
  });

  return result.success;
}
