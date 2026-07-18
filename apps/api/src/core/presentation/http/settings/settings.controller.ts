import { Controller, Get, Patch, Post, Delete, Body, Req, UseGuards, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { GetProfileQuery } from '../../../application/queries/settings/get-profile.query';
import {
  UpdateCompanyCommand,
  UpdatePreferencesCommand,
  UpdateNotificationsCommand,
  AddCertificationCommand,
  DeleteCertificationCommand,
} from '../../../application/commands/settings/settings.commands';

@ApiTags('settings (core)')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsCoreController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obtenir le profil complet (User + Company)' })
  async getProfile(@Req() req: any) {
    return this.queryBus.execute(new GetProfileQuery(req.user.sub));
  }

  @Patch('company')
  @ApiOperation({ summary: 'Mettre à jour les infos de l\'entreprise' })
  async updateCompany(@Req() req: any, @Body() body: any) {
    return this.commandBus.execute(new UpdateCompanyCommand(
      req.user.sub,
      body.name,
      body.registrationNumber,
      body.logoUrl,
      body.description,
    ));
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences (langue, thème)' })
  async updatePreferences(@Req() req: any, @Body() body: any) {
    return this.commandBus.execute(new UpdatePreferencesCommand(req.user.sub, body.locale, body.theme));
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Mettre à jour les préférences de notifications' })
  async updateNotifications(@Req() req: any, @Body() body: any) {
    return this.commandBus.execute(new UpdateNotificationsCommand(req.user.sub, body));
  }

  @Post('certifications')
  @ApiOperation({ summary: 'Ajouter une certification / document' })
  async addCertification(@Req() req: any, @Body() body: any) {
    return this.commandBus.execute(new AddCertificationCommand(
      req.user.sub,
      body.type,
      body.title,
      body.fileUrl,
      body.expiresAt,
    ));
  }

  @Delete('certifications/:id')
  @ApiOperation({ summary: 'Supprimer une certification' })
  async deleteCertification(@Req() req: any, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteCertificationCommand(req.user.sub, id));
  }
}
