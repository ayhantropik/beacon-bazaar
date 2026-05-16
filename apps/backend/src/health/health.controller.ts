import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as nodemailer from 'nodemailer';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Sağlık kontrolü' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'venividicoop-api',
      version: '1.0.0',
      env: {
        resendApiKey: process.env.RESEND_API_KEY ? 'set' : 'missing',
        mailFrom: process.env.MAIL_FROM || 'default',
        smtpHost: process.env.SMTP_HOST ? 'set' : 'missing',
        smtpUser: process.env.SMTP_USER ? 'set' : 'missing',
        smtpPass: process.env.SMTP_PASS ? 'set' : 'missing',
        smtpPort: process.env.SMTP_PORT || 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
        frontendUrl: process.env.FRONTEND_URL || 'missing',
      },
    };
  }

  @Get('mail-test')
  @ApiOperation({ summary: 'Mail gönderim testi (debug)' })
  async mailTest(@Query('to') to: string) {
    const target = to || process.env.SMTP_USER || 'ayhantatay@gmail.com';
    const resendKey = process.env.RESEND_API_KEY;
    const from =
      process.env.MAIL_FROM ||
      (resendKey
        ? 'VeniVidiCoop <onboarding@resend.dev>'
        : `VeniVidiCoop <${process.env.SMTP_USER}>`);

    // Önce Resend
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: target,
            subject: 'VeniVidiCoop — Mail Test (Resend)',
            text: 'Resend üzerinden gönderildi. Bu maili aldıysan Resend çalışıyor.',
          }),
        });
        const data: any = await res.json().catch(() => ({}));
        return { ok: res.ok, provider: 'resend', status: res.status, data };
      } catch (e: any) {
        return { ok: false, provider: 'resend', error: e.message };
      }
    }

    // SMTP fallback
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return { ok: false, provider: 'none', error: 'No mail provider configured' };
    }
    try {
      const t = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        family: 4,
      } as any);
      const info = await t.sendMail({
        from,
        to: target,
        subject: 'VeniVidiCoop — Mail Test (SMTP)',
        text: 'SMTP üzerinden gönderildi.',
      });
      return { ok: true, provider: 'smtp', messageId: info.messageId };
    } catch (e: any) {
      return { ok: false, provider: 'smtp', error: e.message, code: e.code };
    }
  }
}
