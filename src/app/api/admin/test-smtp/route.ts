import { NextResponse } from 'next/server';
import { getEmailTransporter, sendEmail } from '@/lib/emailService';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const ADMIN_PIN = process.env.ADMIN_PIN || 'MBM@Admin2026';
    const isAdmin = 
      cookieHeader.includes('mbm_admin_authenticated=true') ||
      (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === ADMIN_PIN);

    if (!isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

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
      subject: '✅ MegaBachatMart SMTP Verification Successful',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #064E3B;">
          <h2 style="color: #064E3B;">MegaBachatMart Mail Gateway Test</h2>
          <p>This is a verified test email sent from <strong>support@mymbmart.com</strong> via Hostinger SMTP.</p>
          <div style="background: #F0FDF4; border: 1px solid #86EFAC; padding: 12px; border-radius: 8px;">
            <p style="margin: 0; color: #166534; font-weight: bold;">Status: All email services operational</p>
            <p style="margin: 4px 0 0 0; color: #15803D; font-size: 13px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
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
