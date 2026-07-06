import { Controller, Post, Patch, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('collection')
@Controller('collection')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'IA Vision réelle : photo → classification + prix (MediaUploaded→AIVisionProcessed→PriceCalculated)' })
  async analyze(@Req() req: any, @Body() dto: { image: string }) {
    const data = await this.service.analyzeMedia(req.user.sub, dto.image);
    return { success: true, data, message: 'Analyse IA effectuée' };
  }

  @Post('analyze-video')
  @ApiOperation({ summary: 'IA Vision vidéo : keyframes FFmpeg → analyse par frame → fusion (VisionStarted→VisionCompleted)' })
  async analyzeVideo(@Req() req: any, @Body() dto: { video: string }) {
    const data = await this.service.analyzeVideoMedia(req.user.sub, dto.video);
    return { success: true, data, message: 'Analyse vidéo effectuée' };
  }

  @Post()
  @ApiOperation({ summary: 'Citoyen soumet un déchet (WasteSubmitted)' })
  async submit(@Req() req: any, @Body() dto: { materialCategory: string; declaredWeightKg: number; phone?: string; latitude?: number; longitude?: number }) {
    const data = await this.service.submit(req.user.sub, dto);
    return { success: true, data, message: 'Demande de collecte créée' };
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes demandes de collecte' })
  async mine(@Req() req: any) {
    return { success: true, data: await this.service.myRequests(req.user.sub) };
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Mon SymbioWallet (solde + ledger)' })
  async wallet(@Req() req: any) {
    return { success: true, data: await this.service.getWallet(req.user.sub) };
  }

  @Patch(':id/assign')
  async assign(@Param('id') id: string) {
    return { success: true, data: await this.service.assign(id) };
  }

  @Patch(':id/status/:status')
  async status(@Param('id') id: string, @Param('status') status: string) {
    return { success: true, data: await this.service.setStatus(id, status === 'EN_ROUTE' ? 'EN_ROUTE' : 'PICKED_UP') };
  }

  @Patch(':id/validate')
  async validate(@Param('id') id: string, @Body() dto: { validatedWeightKg: number }) {
    return { success: true, data: await this.service.validateWeight(id, dto.validatedWeightKg) };
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Déclenche le paiement → crédite le wallet (PaymentTriggered)' })
  async pay(@Param('id') id: string) {
    const data = await this.service.pay(id);
    return { success: true, data, message: 'Paiement crédité au wallet' };
  }
}
