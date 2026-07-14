'use client';

import { useCallback, useState } from 'react';

export interface StreamMessage {
  message: string;
  module?: string;
  conversationId: string;
}

export function useAIStreamConnection() {
  const [isConnected, setIsConnected] = useState(false);

  const sendMessage = useCallback(
    async (msg: StreamMessage, onToken: (token: string) => void) => {
      setIsConnected(true);

      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
          },
          body: JSON.stringify({
            message: msg.message,
            module: msg.module,
            conversationId: msg.conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'token' && data.token) {
                  onToken(data.token);
                } else if (data.type === 'error') {
                  console.error('AI Error:', data.error);
                  onToken(`\n\n❌ Erreur: ${data.error}`);
                }
              } catch (e) {
                // Skip parse errors
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        onToken(`\n\n❌ Erreur de connexion. Veuillez réessayer.`);
      } finally {
        setIsConnected(false);
      }
    },
    []
  );

  return { isConnected, sendMessage };
}
