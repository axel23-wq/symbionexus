import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RetrievalResult } from './types';

@Injectable()
export class RetrieverService {
  private logger = new Logger(RetrieverService.name);

  constructor(private prisma: PrismaService) {}

  async retrieve(
    query: string,
    module?: string,
    topK: number = 3
  ): Promise<RetrievalResult[]> {
    this.logger.debug(`Retrieving chunks for query: "${query}"`);

    const queryTerms = query.toLowerCase().split(/\s+/);

    const chunks = await this.prisma.codeChunk.findMany({
      take: 100,
    });

    const scored = chunks
      .map((chunk: any) => ({
        ...chunk,
        score: this.scoreChunk(chunk.content, queryTerms),
      }))
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, topK);

    this.logger.debug(`Retrieved ${scored.length} relevant chunks`);

    return scored.map((c: any) => ({
      filePath: c.filePath,
      content: c.content,
      startLine: c.startLine,
      endLine: c.endLine,
      similarity: c.score,
    }));
  }

  private scoreChunk(content: string, queryTerms: string[]): number {
    const contentLower = content.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    }

    return score;
  }
}
