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
      service: 'beacon-bazaar-api',
      version: '1.0.0',
    };
  }
}
