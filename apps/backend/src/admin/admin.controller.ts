import {
  Controller, Get, Patch, Post, Delete,
  Param, Query, Body, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ──────────────────────────────────────────────

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── Users ──────────────────────────────────────────────────

  @Get('users')
  getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers({ page: Number(page) || 1, limit: Number(limit) || 20, search, role, status });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateUserStatus(id, dto.isActive);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() dto: { password: string }) {
    return this.adminService.resetUserPassword(id, dto.password);
  }

  // ─── Stores ─────────────────────────────────────────────────

  @Post('stores')
  createStore(@Body() dto: any) {
    return this.adminService.createStore(dto);
  }

  @Get('stores')
  getStores(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
    @Query('subscriptionStatus') subscriptionStatus?: string,
  ) {
    return this.adminService.getStores({ page: Number(page) || 1, limit: Number(limit) || 20, search, isVerified, isActive, subscriptionStatus });
  }

  @Get('stores/:id')
  getStoreDetail(@Param('id') id: string) {
    return this.adminService.getStoreDetail(id);
  }

  @Patch('stores/:id/verify')
  updateStoreVerification(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateStoreVerification(id, dto.isActive);
  }

  @Patch('stores/:id/status')
  updateStoreStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateStoreStatus(id, dto.isActive);
  }

  // ─── Products ───────────────────────────────────────────────

  @Get('products')
  getProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.adminService.getProducts({ page: Number(page) || 1, limit: Number(limit) || 20, search, category, isActive, isFeatured });
  }

  @Get('products/:id')
  getProductDetail(@Param('id') id: string) {
    return this.adminService.getProductDetail(id);
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateProductStatus(id, dto.isActive);
  }

  @Patch('products/:id/featured')
  updateProductFeatured(@Param('id') id: string, @Body() body: { isFeatured: boolean }) {
    return this.adminService.updateProductFeatured(id, body.isFeatured);
  }

  // ─── Orders ─────────────────────────────────────────────────

  @Get('orders')
  getOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getOrders({ page: Number(page) || 1, limit: Number(limit) || 20, status, userId, dateFrom, dateTo });
  }

  @Get('orders/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }

  // ─── Auctions ───────────────────────────────────────────────

  @Get('auctions')
  getAuctions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAuctions({ page: Number(page) || 1, limit: Number(limit) || 20, status });
  }

  @Get('auctions/:id')
  getAuctionDetail(@Param('id') id: string) {
    return this.adminService.getAuctionDetail(id);
  }

  @Patch('auctions/:id/status')
  updateAuctionStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateAuctionStatus(id, body.status);
  }

  // ─── Moderation ─────────────────────────────────────────────

  @Get('moderation/reviews')
  getReviews(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getReviews({ page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Delete('moderation/reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Get('moderation/questions')
  getQuestions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getQuestions({ page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Delete('moderation/questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.adminService.deleteQuestion(id);
  }

  // ─── Notifications ──────────────────────────────────────────

  @Post('notifications/broadcast')
  broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    return this.adminService.broadcastNotification(dto);
  }

  @Get('notifications/history')
  getNotificationHistory(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getNotificationHistory({ page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  // ─── Reports ────────────────────────────────────────────────

  @Get('reports/sales')
  getSalesReport(
    @Query('period') period?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getSalesReport({ period, dateFrom, dateTo });
  }

  @Get('reports/users')
  getUserGrowthReport(
    @Query('period') period?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getUserGrowthReport({ period, dateFrom, dateTo });
  }

  @Get('reports/stores')
  getStorePerformanceReport(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getStorePerformanceReport({ page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Get('reports/export')
  async exportData(@Query('type') type: string, @Res() res: Response) {
    const result = await this.adminService.exportData(type);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send('\uFEFF' + result.csv); // BOM for Turkish characters
  }

  // ─── Settings ───────────────────────────────────────────────

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSetting(@Body() body: { key: string; value: any }) {
    return this.adminService.updateSetting(body.key, body.value);
  }

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Patch('categories')
  updateCategories(@Body() body: { categories: string[] }) {
    return this.adminService.updateCategories(body.categories);
  }

  @Get('subcategories')
  getSubcategories() {
    return this.adminService.getSubcategories();
  }

  @Patch('subcategories')
  updateSubcategories(@Body() body: { subcategories: Record<string, { title: string; items: string[] }[]> }) {
    return this.adminService.updateSubcategories(body.subcategories);
  }

  // ─── Subscriptions / Aidat ──────────────────────────────────

  @Get('subscriptions')
  getSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('overdue') overdue?: string,
    @Query('storeType') storeType?: string,
  ) {
    return this.adminService.getSubscriptions({
      page: Number(page) || 1, limit: Number(limit) || 20, status, search, overdue, storeType,
    });
  }

  @Get('subscriptions/stats')
  getSubscriptionStats() {
    return this.adminService.getSubscriptionStats();
  }

  @Patch('subscriptions/:storeId')
  updateSubscription(
    @Param('storeId') storeId: string,
    @Body() body: { planType?: string; monthlyFee?: number; status?: string; paidUntil?: string; notes?: string },
  ) {
    return this.adminService.updateSubscription(storeId, body);
  }

  @Post('subscriptions/:storeId/payment')
  recordPayment(@Param('storeId') storeId: string, @Body() body: { months?: number }) {
    return this.adminService.recordPayment(storeId, body.months || 1);
  }

  @Post('subscriptions/:storeId/reminder')
  sendReminder(@Param('storeId') storeId: string) {
    return this.adminService.sendReminder(storeId);
  }

  @Post('subscriptions/suspend-overdue')
  suspendOverdue(@Body() body: { graceDays?: number }) {
    return this.adminService.suspendOverdue(body.graceDays || 7);
  }

  @Post('subscriptions/init-all')
  initAllSubscriptions() {
    return this.adminService.initAllSubscriptions();
  }

  // ─── Profesyonel Hizmetler ──────────────────────────────────

  @Get('services')
  getServiceProviders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isVerified') isVerified?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getServiceProviders({
      page: Number(page) || 1, limit: Number(limit) || 20, search, category, isVerified, isActive,
    });
  }

  @Get('services/stats')
  getServiceProviderStats() {
    return this.adminService.getServiceProviderStats();
  }
}
