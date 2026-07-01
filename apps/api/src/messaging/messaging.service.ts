import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderCompanyId: string, receiverCompanyId: string, content: string, matchId?: string) {
    return this.prisma.message.create({
      data: { senderCompanyId, receiverCompanyId, content, matchId },
    });
  }

  async getConversation(companyId1: string, companyId2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderCompanyId: companyId1, receiverCompanyId: companyId2 },
          { senderCompanyId: companyId2, receiverCompanyId: companyId1 },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getConversations(companyId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderCompanyId: companyId }, { receiverCompanyId: companyId }],
      },
      include: { senderCompany: true, receiverCompany: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversationMap = new Map<string, any>();
    messages.forEach((msg) => {
      const partnerId = msg.senderCompanyId === companyId ? msg.receiverCompanyId : msg.senderCompanyId;
      if (!conversationMap.has(partnerId)) {
        const partner = msg.senderCompanyId === companyId ? msg.receiverCompany : msg.senderCompany;
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: partner.name,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }
      if (!msg.isRead && msg.receiverCompanyId === companyId) {
        const conv = conversationMap.get(partnerId);
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values());
  }

  async markAsRead(companyId: string, partnerCompanyId: string) {
    return this.prisma.message.updateMany({
      where: { senderCompanyId: partnerCompanyId, receiverCompanyId: companyId, isRead: false },
      data: { isRead: true },
    });
  }
}
