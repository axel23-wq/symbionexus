import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PassportsService } from './passports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('passports')
@Controller('passports')
export class PassportsController {
  constructor(private readonly passportsService: PassportsService) {}

  @Post('create/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un passeport numérique pour un contrat signé' })
  async create(@Param('contractId') contractId: string) {
    const passport = await this.passportsService.createPassport(contractId);
    return {
      success: true,
      data: passport,
      message: 'Passeport numérique créé avec QR code unique',
    };
  }

  @Patch(':id/status/:status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le statut de transport' })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    const passport = await this.passportsService.updateTransportStatus(id, status);
    return {
      success: true,
      data: passport,
      message: `Statut mis à jour : ${status}`,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un passeport numérique (public via QR)' })
  async findOne(@Param('id') id: string) {
    const passport = await this.passportsService.findById(id);
    return { success: true, data: passport };
  }

  @Get('contract/:contractId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Passeports d\'un contrat' })
  async findByContract(@Param('contractId') contractId: string) {
    const passports = await this.passportsService.findByContract(contractId);
    return { success: true, data: passports };
  }
}
