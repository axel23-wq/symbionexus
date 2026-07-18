import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { GeoCategory } from '@prisma/client';

export class SearchGeoLocationDto {
  @ApiPropertyOptional({ description: 'Latitude centrale pour la recherche par rayon', minimum: -90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude centrale pour la recherche par rayon', minimum: -180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  lng?: number;

  @ApiPropertyOptional({ description: 'Rayon de recherche en kilomètres', default: 10, minimum: 0.1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  radiusKm?: number;

  @ApiPropertyOptional({ enum: GeoCategory, description: 'Filtrer par catégorie' })
  @IsOptional()
  @IsEnum(GeoCategory)
  category?: GeoCategory;

  @ApiPropertyOptional({ description: 'Filtrer par arrondissement (ex: Douala I)' })
  @IsOptional()
  @IsString()
  district?: string;
}
