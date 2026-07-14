'use client';

import { Message } from './types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`ai-message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className={`ai-message ${isUser ? 'user-message' : 'assistant-message'}`}>
        {message.content}
        {message.isStreaming && <span className="ai-cursor">▌</span>}
      </div>
    </div>
  );
}
