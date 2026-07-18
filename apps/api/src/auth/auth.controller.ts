import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscrire une nouvelle entreprise et son utilisateur' })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email ou NIU déjà utilisé' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
      message: 'Inscription réussie ! Bienvenue sur SymbioNexus.',
    };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 1000 } }) // anti brute-force : 1000 tentatives / min / IP pendant le dev
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion avec email et mot de passe' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Headers:', req.headers);
    console.log('Body received:', req.body);
    console.log('DTO:', dto);
    const ip = req.ip || req.connection.remoteAddress;
    const result = await this.authService.login(dto, ip);
    return {
      success: true,
      data: result,
      message: 'Connexion réussie !',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      data: result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
  async getProfile(@Req() req: any) {
    const user = await this.authService.getProfile(req.user.sub);
    return {
      success: true,
      data: user,
    };
  }
}
