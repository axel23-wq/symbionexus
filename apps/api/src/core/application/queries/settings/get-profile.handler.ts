import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetProfileQuery } from './get-profile.query';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProfileQuery) {
    const user = await this.prisma.user.findUnique({
      where: { id: query.userId },
      include: { company: { include: { complianceDocuments: { orderBy: { createdAt: 'desc' } } } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user as any).role?.name || 'SELLER',
        locale: user.locale,
        theme: user.theme,
        notificationPrefs: user.notificationPrefs,
      },
      company: user.company,
    };
  }
}
