import { Module } from '@nestjs/common';
import { XAiService } from './xai.service';

@Module({
  providers: [XAiService],
  exports: [XAiService],
})
export class XAiModule {}
