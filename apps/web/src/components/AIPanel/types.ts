export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AIPanelState {
  isOpen: boolean;
  messages: Message[];
  currentInput: string;
  isLoading: boolean;
  conversationId: string;
  selectedModule?: string;
  demoMode?: boolean;
}
