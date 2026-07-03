import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationsDto {
  @ApiProperty({ example: { negotiation: true, contractSignature: true, aiMatch: false } })
  @IsObject()
  prefs!: Record<string, boolean>;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional() @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'dark' })
  @IsOptional() @IsString()
  theme?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'https://erp.example.cm/webhooks/symbionexus' })
  @IsOptional() @IsString()
  webhookUrl?: string;
}

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Intégration ERP usine' })
  @IsString()
  label!: string;
}

export class AddCertificationDto {
  @ApiProperty({ example: 'ISO_14001' })
  @IsString() type!: string;

  @ApiProperty({ example: 'Certificat ISO 14001' })
  @IsString() title!: string;

  @ApiProperty({ example: 'data:application/pdf;base64,...' })
  @IsString() fileUrl!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() expiresAt?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isVerified?: boolean;
}
