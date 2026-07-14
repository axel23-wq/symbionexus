import { IsString, IsOptional } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class ChatResponseDto {
  conversationId: string;
  messageId: string;
  response: string;
  tokenCount: number;
}
