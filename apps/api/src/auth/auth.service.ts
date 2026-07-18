import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  /**
   * Register a new user and create their company
   */
  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }



    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create company and user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          companySector: dto.companySector,
          companyAddress: dto.companyAddress,
          companyCity: dto.companyCity,
          companyCountry: dto.companyCountry,
          companyLatitude: dto.companyLatitude,
          companyLongitude: dto.companyLongitude,
          description: dto.companyDescription,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: undefined, // Requires explicit migration of dto.role to roleId
          companyId: company.id,
        },
        include: { company: true, role: true },
      });

      return user;
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.id, result.email, (result as any).role?.name || 'SELLER', false, result.companyId);

    return {
      ...tokens,
      user: this.sanitizeUser(result),
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.audit.log(user.id, 'LOGIN', ip, 'FAILURE', { email: dto.email });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte a été désactivé');
    }

    const rememberMe = dto.rememberMe || false;
    const tokens = await this.generateTokens(user.id, user.email, (user as any).role?.name || 'SELLER', rememberMe, user.companyId);
    await this.audit.log(user.id, 'LOGIN', ip, 'SUCCESS');

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { company: true, role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token invalide');
      }

      const tokens = await this.generateTokens(user.id, user.email, (user as any).role?.name || 'SELLER', false, user.companyId);
      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    return this.sanitizeUser(user);
  }

  // ============ Private helpers ============

  private async generateTokens(userId: string, email: string, role: string, rememberMe = false, companyId?: string) {
    const payload = { sub: userId, email, role, companyId };

    const accessExpiry = rememberMe ? '30d' : '15m';
    const refreshExpiry = rememberMe ? '60d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'jwt-secret-dev',
        expiresIn: accessExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev',
        expiresIn: refreshExpiry,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, role, ...sanitized } = user;
    return { ...sanitized, role: role?.name || 'SELLER' };
  }
}
