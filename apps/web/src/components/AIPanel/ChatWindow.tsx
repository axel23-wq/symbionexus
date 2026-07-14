'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Message } from './types';

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="ai-chat-window">
      {messages.length === 0 && (
        <div className="ai-empty-state">
          <div className="ai-empty-icon">🤖</div>
          <p>Bienvenue dans SymbioNexus AI</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Posez vos questions sur le projet, le marché, ou demandez de l'aide.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      <div ref={endRef} />
    </div>
  );
}
