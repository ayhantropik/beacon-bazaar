import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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
}
