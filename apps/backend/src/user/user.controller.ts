import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.id || req.user.sub);
  }

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAddresses(@Req() req: any) {
    return this.userService.getAddresses(req.user.id || req.user.sub);
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createAddress(@Req() req: any, @Body() body: Record<string, unknown>) {
    return this.userService.createAddress(req.user.id || req.user.sub, body);
  }

  @Put('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateAddress(@Req() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.userService.updateAddress(req.user.id || req.user.sub, id, body);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteAddress(@Req() req: any, @Param('id') id: string) {
    return this.userService.deleteAddress(req.user.id || req.user.sub, id);
  }
}
