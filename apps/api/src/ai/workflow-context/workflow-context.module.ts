import { Module } from '@nestjs/common';
import { WorkflowContextService } from './workflow-context.service';

@Module({
  providers: [WorkflowContextService],
  exports: [WorkflowContextService],
})
export class WorkflowContextModule {}
