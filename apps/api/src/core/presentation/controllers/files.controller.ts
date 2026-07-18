import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards, Body, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly uploadFileUseCase: UploadFileUseCase) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader un fichier (Local ou S3 selon config)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body('entityType') entityType?: string,
    @Body('entityId') entityId?: string,
  ) {
    const user = req.user;
    
    const savedFile = await this.uploadFileUseCase.execute({
      fileBuffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploaderId: user.sub,
      companyId: user.companyId,
      entityType,
      entityId,
    });

    return {
      success: true,
      data: savedFile,
    };
  }

  // Route to serve local files (only needed if using Local storage)
  @Get(':filename')
  @ApiOperation({ summary: 'Servir un fichier uploadé localement' })
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier non trouvé');
    }
    res.sendFile(filePath);
  }
}
