import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const KEY_PREFIX = 'symbio_live_';

export interface MaskedApiKey {
  id: string;
  label: string;
  masked: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private hash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private async companyIdOf(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user.companyId;
  }

  async list(userId: string): Promise<MaskedApiKey[]> {
    const companyId = await this.companyIdOf(userId);
    const keys = await this.prisma.apiKey.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    return keys.map((k) => ({
      id: k.id,
      label: k.label,
      masked: `${k.prefix}${'•'.repeat(24)}${k.lastFour}`,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
    }));
  }

  /** Génère une clé — la clé complète n'est renvoyée qu'UNE seule fois. */
  async create(userId: string, label: string, ip?: string): Promise<{ id: string; label: string; key: string; createdAt: Date }> {
    const companyId = await this.companyIdOf(userId);
    const secret = crypto.randomBytes(24).toString('hex'); // 48 caractères
    const fullKey = `${KEY_PREFIX}${secret}`;
    const rec = await this.prisma.apiKey.create({
      data: { companyId, label, prefix: KEY_PREFIX, lastFour: secret.slice(-4), keyHash: this.hash(fullKey) },
    });
    await this.audit.log(userId, 'API_KEY_CREATED', ip, 'SUCCESS', { keyId: rec.id, label });
    return { id: rec.id, label: rec.label, key: fullKey, createdAt: rec.createdAt };
  }

  async revoke(userId: string, id: string, ip?: string): Promise<{ success: true }> {
    const companyId = await this.companyIdOf(userId);
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.companyId !== companyId) throw new NotFoundException('Clé API introuvable');
    await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.audit.log(userId, 'API_KEY_REVOKED', ip, 'SUCCESS', { keyId: id });
    return { success: true };
  }
}
