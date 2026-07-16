import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CodeChunk } from './types';

@Injectable()
export class IndexerService {
  private logger = new Logger(IndexerService.name);
  private readonly FILES_TO_INDEX = [
    'CLAUDE.md',
    'apps/api/prisma/schema.prisma',
    'apps/api/src/matches/matches.service.ts',
    'apps/api/src/auth/auth.service.ts',
    'apps/api/src/listings/listings.service.ts',
  ];

  constructor(private prisma: PrismaService) {}

  async indexProject(projectRoot: string): Promise<void> {
    this.logger.log('Starting project indexing...');

    // Clear existing chunks
    await this.prisma.codeChunk.deleteMany({});

    for (const file of this.FILES_TO_INDEX) {
      const filePath = path.join(projectRoot, file);

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const chunks = this.chunkContent(file, content);

      for (const chunk of chunks) {
        await this.prisma.codeChunk.create({
          data: {
            filePath: chunk.filePath,
            content: chunk.content,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            metadata: chunk.metadata,
          },
        });
      }

      this.logger.debug(`Indexed ${chunks.length} chunks from ${file}`);
    }

    this.logger.log('Indexing complete');
  }

  private chunkContent(filePath: string, content: string): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];
    const chunkSize = 1000; // characters

    let currentChunk = '';
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      currentChunk += lines[i] + '\n';

      if (currentChunk.length > chunkSize) {
        chunks.push({
          filePath,
          content: currentChunk.trim(),
          startLine,
          endLine: i,
          metadata: { fileName: path.basename(filePath) },
        });

        currentChunk = '';
        startLine = i + 1;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        filePath,
        content: currentChunk.trim(),
        startLine,
        endLine: lines.length - 1,
        metadata: { fileName: path.basename(filePath) },
      });
    }

    return chunks;
  }
}
