import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsArray, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GeoCategory } from '@prisma/client';

export class ImportGeoLocationDto {
  @ApiProperty({ description: 'Nom officiel de la structure (ex: Port de Douala-Bonabéri)' })
  @IsString()
  officialName: string;

  @ApiProperty({ enum: GeoCategory, description: 'Catégorie principale' })
  @IsEnum(GeoCategory)
  category: GeoCategory;

  @ApiPropertyOptional({ description: 'Sous-catégorie' })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional({ description: 'Adresse physique' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Quartier' })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiProperty({ description: 'Arrondissement (ex: Douala I)' })
  @IsString()
  district: string;

  @ApiPropertyOptional({ description: 'Ville', default: 'Douala' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Latitude exacte', minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude exacte', minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Niveau de confiance de la donnée (0 à 1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceLevel?: number;

  @ApiProperty({ description: 'Source officielle de la donnée (OBLIGATOIRE)' })
  @IsString()
  officialSource: string;
}
