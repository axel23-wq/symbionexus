import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { ComputeAiMatchCommand } from '../../../application/commands/ai-match/ai-match.commands';

@ApiTags('ai (core)')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('match/:listingId')
  @ApiOperation({ summary: 'Déclencher l\'IA de Matchmaking pour une annonce spécifique' })
  @ApiParam({ name: 'listingId', description: 'ID de l\'annonce à analyser' })
  async computeAiMatch(
    @Param('listingId') listingId: string,
    @Req() req: any
  ) {
    const matches = await this.commandBus.execute(
      new ComputeAiMatchCommand(listingId)
    );
    
    return {
      success: true,
      message: 'Analyse IA terminée avec succès',
      data: matches,
    };
  }
}
