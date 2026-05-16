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
        smtpHost: process.env.SMTP_HOST ? 'set' : 'missing',
        smtpUser: process.env.SMTP_USER ? 'set' : 'missing',
        smtpPass: process.env.SMTP_PASS ? 'set' : 'missing',
        smtpPort: process.env.SMTP_PORT || 'missing',
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing',
        frontendUrl: process.env.FRONTEND_URL || 'missing',
      },
    };
  }

  @Get('smtp-test')
  @ApiOperation({ summary: 'SMTP gönderim testi (debug)' })
  async smtpTest(@Query('to') to: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return { ok: false, stage: 'config', error: 'SMTP env eksik' };
    }
    const target = to || user;
    try {
      const t = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
      });
      await t.verify();
      const info = await t.sendMail({
        from: `"VeniVidiCoop SMTP Test" <${user}>`,
        to: target,
        subject: 'SMTP Test (Render)',
        text: 'Render üzerinden gönderildi. Mesaj geldiyse SMTP çalışıyor.',
      });
      return {
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response,
      };
    } catch (e: any) {
      return {
        ok: false,
        stage: 'send',
        error: e.message,
        code: e.code,
        command: e.command,
      };
    }
  }
}
