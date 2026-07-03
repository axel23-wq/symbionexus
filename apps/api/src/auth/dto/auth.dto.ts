import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Role {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  TRANSPORTER = 'TRANSPORTER',
  REGULATOR = 'REGULATOR',
  ADMIN = 'ADMIN',
}

export class LoginDto {
  @ApiProperty({ example: 'contact@greencycle.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'contact@greencycle.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.SELLER })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'GreenCycle Industries' })
  @IsString()
  companyName: string;



  @ApiProperty({ example: 'Agroalimentaire' })
  @IsString()
  companySector: string;

  @ApiProperty({ example: 'Zone Industrielle de Bassa, BP 4011 Douala' })
  @IsString()
  companyAddress: string;

  @ApiProperty({ example: 'Douala' })
  @IsString()
  companyCity: string;

  @ApiProperty({ example: 'Cameroun' })
  @IsString()
  companyCountry: string;

  @ApiProperty({ example: 45.7578 })
  @IsNumber()
  companyLatitude: number;

  @ApiProperty({ example: 4.8320 })
  @IsNumber()
  companyLongitude: number;

  @ApiPropertyOptional({ example: 'Leader du recyclage de marc de café en Auvergne-Rhône-Alpes' })
  @IsOptional()
  @IsString()
  companyDescription?: string;
}
