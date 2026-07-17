'use client';

import { useCallback, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        console.log('🤖 AI Request:', { url: `${API_URL}/ai/chat`, message: msg.message, module: msg.module, hasToken: !!token });

        const response = await fetch(`${API_URL}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: msg.message,
            module: msg.module,
            conversationId: msg.conversationId,
          }),
        });

        console.log('🤖 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error body');
          console.error('❌ HTTP Error:', { status: response.status, statusText: response.statusText, body: errorText });
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`);
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
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Stream error detail:', errorMsg);

        // Diagnostiquer type d'erreur
        if (errorMsg.includes('Failed to fetch')) {
          console.error('💡 Diagnostic: CORS ou serveur inaccessible. Vérifier:');
          console.error('  1. Backend running? (http://localhost:4000)');
          console.error('  2. CORS headers OK?');
          console.error('  3. Frontend .env: NEXT_PUBLIC_API_URL=', process.env.NEXT_PUBLIC_API_URL);
          onToken(`\n\n❌ Serveur inaccessible. Vérifier backend sur http://localhost:4000`);
        } else if (errorMsg.includes('HTTP 401')) {
          console.error('💡 Diagnostic: Token expiré ou invalide');
          onToken(`\n\n❌ Non authentifié. Reconnecter.`);
        } else if (errorMsg.includes('HTTP 404')) {
          console.error('💡 Diagnostic: Route /ai/chat n\'existe pas');
          onToken(`\n\n❌ Route API non trouvée. Vérifier backend.`);
        } else if (errorMsg.includes('HTTP 500')) {
          console.error('💡 Diagnostic: Erreur serveur interne');
          onToken(`\n\n❌ Erreur serveur. Voir logs backend.`);
        } else {
          console.error('💡 Diagnostic: Erreur inconnue', errorMsg);
          onToken(`\n\n❌ ${errorMsg}`);
        }
      } finally {
        setIsConnected(false);
      }
    },
    []
  );

  return { isConnected, sendMessage };
}
