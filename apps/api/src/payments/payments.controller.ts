import { Controller, Post, Get, Body, Param, Req, Headers, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayoutService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment-provider.interface';
import { Inject } from '@nestjs/common';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly service: PayoutService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  @Post('payout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Décaissement du SymbioWallet vers Mobile Money (PayoutInitiated)' })
  async payout(@Req() req: any, @Body() dto: { amount: number; phone: string }) {
    const data = await this.service.requestPayout(req.user.sub, dto.amount, dto.phone);
    return { success: true, data, message: 'Décaissement initié' };
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myPayouts(@Req() req: any) {
    return { success: true, data: await this.service.myPayouts(req.user.sub) };
  }

  /**
   * Webhook prestataire (public, authentifié par signature HMAC — pas de JWT).
   * NOTE PROD : la vérification HMAC exige le corps brut (raw body). Ajouter un
   * middleware raw-body sur cette route avant mise en production réelle.
   */
  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Callback prestataire Mobile Money (règlement réel)' })
  async webhook(@Param('provider') provider: string, @Body() body: any, @Headers() headers: Record<string, unknown>) {
    const rawBody = JSON.stringify(body ?? {});
    if (!this.provider.verifyWebhook(rawBody, headers)) throw new ForbiddenException('Signature webhook invalide');
    const parsed = this.provider.parseWebhook(body);
    const data = await this.service.handleWebhook(provider, parsed);
    return { success: true, data };
  }

  /**
   * ⚠️ OUTIL DEV TEMPORAIRE — confirme/échoue un décaissement à la main,
   * en remplacement du webhook prestataire tant que les clés ne sont pas fournies.
   * Actif UNIQUEMENT si PAYMENT_PROVIDER=dev. À supprimer en production.
   */
  @Post('dev/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async devConfirm(@Body() dto: { providerRef: string; status?: 'CONFIRMED' | 'FAILED'; failureReason?: string }) {
    if ((process.env.PAYMENT_PROVIDER || 'dev') !== 'dev') throw new ForbiddenException('Endpoint dev désactivé');
    if (!dto?.providerRef) throw new BadRequestException('providerRef requis');
    const data = await this.service.handleWebhook('dev', {
      providerRef: dto.providerRef,
      status: dto.status || 'CONFIRMED',
      failureReason: dto.failureReason,
    });
    return { success: true, data };
  }
}
