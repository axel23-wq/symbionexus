import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionGateway } from './collection.gateway';
import { AiVisionService } from './ai-vision.service';

@Module({
  controllers: [CollectionController],
  providers: [CollectionService, CollectionGateway, AiVisionService],
})
export class CollectionModule {}
