import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // SMTP ayarları .env'den alınır, yoksa ethereal (test) kullanılır
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email SMTP configured: ${host}`);
    } else {
      this.transporter = null as any;
      this.logger.warn('Email SMTP not configured — verification links will be logged to console');
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string, type: 'store' | 'user' = 'user'): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const subtitle = type === 'store' ? 'Mağaza Üyelik Onayı' : 'E-posta Onayı';
    const bodyText = type === 'store'
      ? `<strong>${name}</strong> mağazanız VeniVidiCoop platformunda oluşturuldu. Üyeliğinizi aktifleştirmek için aşağıdaki butona tıklayın:`
      : `Merhaba <strong>${name}</strong>, VeniVidiCoop'a hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:`;
    const subject = type === 'store' ? `${name} — Mağaza Üyelik Onayı` : 'VeniVidiCoop — E-posta Onayı';

    const html = `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1a6b52,#0e4a38);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">VeniVidiCoop</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">${subtitle}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#2c1810;margin:0 0 16px;">Merhaba!</h2>
          <p style="color:#6b5b4e;line-height:1.6;">${bodyText}</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${verifyUrl}" style="background:#1a6b52;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
              ✓ Hesabımı Onayla
            </a>
          </div>
          <p style="color:#999;font-size:13px;">
            Veya bu bağlantıyı tarayıcınıza yapıştırın:<br>
            <a href="${verifyUrl}" style="color:#1a6b52;word-break:break-all;">${verifyUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="color:#999;font-size:12px;text-align:center;">
            Bu e-postayı siz talep etmediyseniz görmezden gelebilirsiniz.<br>
            &copy; 2026 VeniVidiCoop — Üreticiden tüketiciye
          </p>
        </div>
      </div>
    `;

    this.logger.log(`\n========================================`);
    this.logger.log(`📧 E-POSTA ONAY LİNKİ`);
    this.logger.log(`   İsim: ${name}`);
    this.logger.log(`   E-posta: ${to}`);
    this.logger.log(`   Tip: ${type}`);
    this.logger.log(`   Onay URL: ${verifyUrl}`);
    this.logger.log(`========================================\n`);

    if (!this.transporter) return false;

    try {
      const info = await this.transporter.sendMail({
        from: `"VeniVidiCoop" <${process.env.SMTP_USER || 'noreply@beaconbazaar.com'}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Verification email sent to ${to} — messageId: ${info.messageId}`);
      return true;
    } catch (err) {
      this.logger.warn(`Email send failed to ${to}: ${err}`);
      return false;
    }
  }
}
