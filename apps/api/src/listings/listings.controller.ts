import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle annonce de déchet' })
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    const listing = await this.listingsService.create(req.user.sub, dto);
    return { success: true, data: listing, message: 'Annonce créée avec succès' };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les annonces (Marketplace publique)' })
  @ApiQuery({ name: 'materialCategory', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'minVolume', required: false })
  @ApiQuery({ name: 'maxVolume', required: false })
  @ApiQuery({ name: 'latitude', required: false })
  @ApiQuery({ name: 'longitude', required: false })
  @ApiQuery({ name: 'radiusKm', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  async findAll(
    @Query('materialCategory') materialCategory?: string,
    @Query('search') search?: string,
    @Query('minVolume') minVolume?: number,
    @Query('maxVolume') maxVolume?: number,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radiusKm') radiusKm?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    const result = await this.listingsService.findAll({
      materialCategory, search, minVolume, maxVolume,
      latitude, longitude, radiusKm, status, page, perPage,
    });
    return { success: true, ...result };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes annonces (entreprise courante)' })
  async findMine(@Req() req: any) {
    const user = await this.listingsService['prisma'].user.findUnique({
      where: { id: req.user.sub },
    });
    const listings = await this.listingsService.findByCompany(user!.companyId);
    return { success: true, data: listings };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une annonce' })
  async findOne(@Param('id') id: string) {
    const listing = await this.listingsService.findById(id);
    return { success: true, data: listing };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une annonce' })
  async update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateListingDto) {
    const listing = await this.listingsService.update(id, req.user.sub, dto);
    return { success: true, data: listing, message: 'Annonce mise à jour' };
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier une annonce (DRAFT → PUBLISHED)' })
  async publish(@Param('id') id: string, @Req() req: any) {
    const listing = await this.listingsService.publish(id, req.user.sub);
    return { success: true, data: listing, message: 'Annonce publiée sur la marketplace !' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une annonce' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.listingsService.remove(id, req.user.sub);
    return { success: true, message: 'Annonce supprimée' };
  }
}
