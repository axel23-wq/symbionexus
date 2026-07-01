import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum MaterialCategory {
  METALS = 'METALS',
  PLASTICS = 'PLASTICS',
  BIOMASS = 'BIOMASS',
  CHEMICALS = 'CHEMICALS',
  TEXTILE = 'TEXTILE',
  CONSTRUCTION = 'CONSTRUCTION',
  THERMAL = 'THERMAL',
  GLASS = 'GLASS',
  PAPER = 'PAPER',
  ELECTRONIC = 'ELECTRONIC',
}

enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ON_DEMAND = 'ON_DEMAND',
}

export class CreateListingDto {
  @ApiProperty({ example: 'Marc de café — 5 tonnes/semaine' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Marc de café usagé' })
  @IsString()
  materialType: string;

  @ApiProperty({ enum: MaterialCategory, example: MaterialCategory.BIOMASS })
  @IsEnum(MaterialCategory)
  materialCategory: MaterialCategory;

  @ApiProperty({ example: 'Marc de café séché et conditionné en big bags de 500kg' })
  @IsString()
  description: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  volumeKg: number;

  @ApiProperty({ enum: Frequency, example: Frequency.WEEKLY })
  @IsEnum(Frequency)
  frequency: Frequency;

  @ApiPropertyOptional()
  @IsOptional()
  chemicalProfile?: Record<string, any>;

  @ApiPropertyOptional({ example: 0.15 })
  @IsOptional()
  @IsNumber()
  pricePerKg?: number;

  @ApiProperty({ example: 45.7578 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 4.832 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class UpdateListingDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() materialType?: string;
  @IsOptional() @IsEnum(MaterialCategory) materialCategory?: MaterialCategory;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(1) volumeKg?: number;
  @IsOptional() @IsEnum(Frequency) frequency?: Frequency;
  @IsOptional() @IsNumber() pricePerKg?: number;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsArray() photos?: string[];
}

export class ListingFilterDto {
  @IsOptional() @IsString() materialCategory?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumber() minVolume?: number;
  @IsOptional() @IsNumber() maxVolume?: number;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() perPage?: number;
}
