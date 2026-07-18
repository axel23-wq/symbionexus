import { useEffect, useState, useCallback } from 'react';
import { Message } from './types';

export interface StoredConversation {
  conversationId: string;
  messages: Message[];
  timestamp: number;
  title: string;
}

const STORAGE_KEY = 'aipanel_conversations';
const MAX_CONVERSATIONS = 50;

export function useConversationStorage() {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredConversation[];
        setConversations(parsed.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save conversation to localStorage
  const saveConversation = useCallback(
    (conversationId: string, messages: Message[]) => {
      if (messages.length === 0) return;

      try {
        const title =
          messages
            .find((m) => m.role === 'user')
            ?.content.substring(0, 40) || 'Untitled Conversation';

        const newConversation: StoredConversation = {
          conversationId,
          messages,
          timestamp: Date.now(),
          title,
        };

        setConversations((prev) => {
          // Remove if already exists
          const filtered = prev.filter((c) => c.conversationId !== conversationId);
          // Add new one and sort
          const updated = [newConversation, ...filtered].slice(0, MAX_CONVERSATIONS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    },
    []
  );

  // Delete conversation
  const deleteConversation = useCallback((conversationId: string) => {
    try {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.conversationId !== conversationId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, []);

  // Clear all conversations
  const clearAll = useCallback(() => {
    try {
      setConversations([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear conversations:', error);
    }
  }, []);

  return {
    conversations,
    saveConversation,
    deleteConversation,
    clearAll,
    isLoading,
  };
}

// Helper to format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) {
    const hour = new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Today ${hour}`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
