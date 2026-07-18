import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IFileStorageService, FileUploadResult } from '../../domain/services/file-storage.interface';

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly baseUrl = process.env.API_URL || 'http://localhost:4000/api/v1';

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<FileUploadResult> {
    const ext = path.extname(originalFilename);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);
    this.logger.log(`File saved locally: ${filename}`);

    return {
      url: `${this.baseUrl}/files/${filename}`,
      filename: filename,
      sizeBytes: fileBuffer.length,
      mimeType: mimeType,
    };
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const filename = url.split('/').pop();
      if (!filename) return;

      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`File deleted locally: ${filename}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${url}`, error);
    }
  }
}
