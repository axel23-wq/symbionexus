import { Controller, Get, Post, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('compute/:listingId')
  @ApiOperation({ summary: 'Lancer le matchmaking IA pour une annonce' })
  @ApiQuery({ name: 'maxResults', required: false })
  @ApiQuery({ name: 'maxDistanceKm', required: false })
  async computeMatches(
    @Param('listingId') listingId: string,
    @Query('maxResults') maxResults?: number,
    @Query('maxDistanceKm') maxDistanceKm?: number,
  ) {
    const matches = await this.matchesService.computeMatches(
      listingId,
      maxResults || 10,
      maxDistanceKm || 500,
    );
    return {
      success: true,
      data: matches,
      message: `${matches.length} correspondances trouvées par l'IA`,
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes matchs (entreprise courante)' })
  async findMine(@Req() req: any) {
    const user = await this.matchesService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const matches = await this.matchesService.findByCompany(user!.companyId);
    return { success: true, data: matches };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un match' })
  async findOne(@Param('id') id: string) {
    const match = await this.matchesService.findById(id);
    return { success: true, data: match };
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accepter un match' })
  async acceptMatch(@Param('id') id: string, @Req() req: any) {
    const match = await this.matchesService.acceptMatch(id, req.user.sub);
    return {
      success: true,
      data: match,
      message: match.status === 'CONFIRMED'
        ? '🎉 Match confirmé par les deux parties ! Un contrat va être généré.'
        : 'Match accepté, en attente de la validation de l\'autre partie.',
    };
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeter un match' })
  async rejectMatch(@Param('id') id: string) {
    const match = await this.matchesService.rejectMatch(id);
    return { success: true, data: match, message: 'Match rejeté' };
  }
}
