import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { ApiKeysService } from './api-keys.service';
import { AuditService } from '../audit/audit.service';
import {
  UpdateNotificationsDto,
  UpdatePreferencesDto,
  UpdateCompanyDto,
  UpdateWebhookDto,
  CreateApiKeyDto,
  AddCertificationDto,
} from './dto/settings.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly apiKeys: ApiKeysService,
    private readonly audit: AuditService,
  ) {}

  private uid(req: any): string { return req.user.sub; }
  private ip(req: any): string | undefined { return req.headers['x-forwarded-for'] || req.ip; }

  // ---- Profil / identité B2B ----
  @Get('profile')
  @ApiOperation({ summary: 'Profil utilisateur + entreprise + certifications' })
  getProfile(@Req() req: any) {
    return this.wrap(this.settings.getProfile(this.uid(req)));
  }

  @Patch('company')
  updateCompany(@Req() req: any, @Body() dto: UpdateCompanyDto) {
    return this.wrap(this.settings.updateCompany(this.uid(req), dto));
  }

  @Post('certifications')
  addCertification(@Req() req: any, @Body() dto: AddCertificationDto) {
    return this.wrap(this.settings.addCertification(this.uid(req), dto));
  }

  @Delete('certifications/:id')
  deleteCertification(@Req() req: any, @Param('id') id: string) {
    return this.wrap(this.settings.deleteCertification(this.uid(req), id));
  }

  // ---- Préférences (langue / thème) ----
  @Patch('preferences')
  updatePreferences(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.wrap(this.settings.updatePreferences(this.uid(req), dto));
  }

  // ---- Notifications ----
  @Patch('notifications')
  updateNotifications(@Req() req: any, @Body() dto: UpdateNotificationsDto) {
    return this.wrap(this.settings.updateNotifications(this.uid(req), dto.prefs));
  }

  // ---- Webhook ----
  @Patch('webhook')
  updateWebhook(@Req() req: any, @Body() dto: UpdateWebhookDto) {
    return this.wrap(this.settings.updateWebhook(this.uid(req), dto.webhookUrl));
  }

  // ---- Clés API ----
  @Get('api-keys')
  listApiKeys(@Req() req: any) {
    return this.wrap(this.apiKeys.list(this.uid(req)));
  }

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  createApiKey(@Req() req: any, @Body() dto: CreateApiKeyDto) {
    return this.wrap(this.apiKeys.create(this.uid(req), dto.label, this.ip(req)));
  }

  @Delete('api-keys/:id')
  revokeApiKey(@Req() req: any, @Param('id') id: string) {
    return this.wrap(this.apiKeys.revoke(this.uid(req), id, this.ip(req)));
  }

  // ---- Journal d'audit ----
  @Get('audit')
  auditLog(@Req() req: any) {
    return this.wrap(this.audit.list(this.uid(req)));
  }

  private async wrap<T>(p: Promise<T>) {
    const data = await p;
    return { success: true, data };
  }
}
