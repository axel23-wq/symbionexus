import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('generate/:matchId')
  @ApiOperation({ summary: 'Générer un contrat à partir d\'un match confirmé' })
  async generate(@Param('matchId') matchId: string) {
    const contract = await this.contractsService.generateFromMatch(matchId);
    return { success: true, data: contract, message: 'Contrat généré avec succès' };
  }

  @Patch(':id/sign')
  @ApiOperation({ summary: 'Signer un contrat' })
  async sign(@Param('id') id: string, @Req() req: any) {
    const contract = await this.contractsService.signContract(id, req.user.sub);
    const isFull = contract.sellerSigned && contract.buyerSigned;
    return {
      success: true,
      data: contract,
      message: isFull
        ? '🎉 Contrat signé par les deux parties ! Prêt pour la première livraison.'
        : 'Contrat signé, en attente de la signature de l\'autre partie.',
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes contrats' })
  async findMine(@Req() req: any) {
    const user = await this.contractsService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const contracts = await this.contractsService.findByCompany(user!.companyId);
    return { success: true, data: contracts };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un contrat' })
  async findOne(@Param('id') id: string) {
    const contract = await this.contractsService.findById(id);
    return { success: true, data: contract };
  }
}
