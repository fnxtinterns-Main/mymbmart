import { NextResponse } from 'next/server';
import { buildBrandEmailLayout, getEmailTransporter, sendEmail } from '@/lib/emailService';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawRecipient = String(body.recipient || '').trim();
    // Prevent open relay: restrict test emails strictly to official company domains
    const testRecipient = rawRecipient.endsWith('@mymbmart.com') ? rawRecipient : 'support@mymbmart.com';

    // 1. Verify SMTP connection directly
    const transporter = getEmailTransporter();
    const isConnected = await new Promise<boolean>((resolve) => {
      transporter.verify((error: any) => {
        if (error) {
          console.error('[SMTP Verify] Connection failed:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to establish connection with smtp.hostinger.com:465. Check credentials or firewall.',
          host: 'smtp.hostinger.com',
          port: 465,
          user: 'support@mymbmart.com',
        },
        { status: 502 }
      );
    }

    // 2. Send test mail
    const result = await sendEmail({
      to: testRecipient,
      subject: 'MegaBachatMart SMTP Verification Successful',
      html: buildBrandEmailLayout({
        badge: 'SMTP Verified',
        title: 'Mail Gateway Test Successful',
        subtitle: 'Sent via support@mymbmart.com',
        bodyHtml: `
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
            This is a verified test email sent from <strong>support@mymbmart.com</strong> via Hostinger SMTP.
          </p>
          <div style="background-color: #F2FBF6; border: 1px solid #BBF7D0; border-left: 4px solid #16A34A; padding: 14px 16px; border-radius: 10px;">
            <p style="margin: 0; color: #064E3B; font-weight: 700; font-size: 13px;">Status: All email services operational</p>
            <p style="margin: 4px 0 0 0; color: #15803D; font-size: 12px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `SMTP successfully authenticated and test email dispatched to ${testRecipient}`
        : `SMTP connected but dispatch failed: ${result.error}`,
      details: {
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        user: 'support@mymbmart.com',
        recipient: testRecipient,
        messageId: result.messageId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'SMTP diagnostic error',
      },
      { status: 500 }
    );
  }
}
