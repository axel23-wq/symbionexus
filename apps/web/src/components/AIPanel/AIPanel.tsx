'use client';

import { useEffect, useReducer } from 'react';
import { usePathname } from 'next/navigation';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import { AIPanelState, Message } from './types';
import { useAIStreamConnection } from './useAIStreamConnection';
import { detectModuleFromPath } from '@/lib/module-detector';
import styles from './AIPanel.module.css';

const initialState: AIPanelState = {
  isOpen: false,
  messages: [],
  currentInput: '',
  isLoading: false,
  conversationId: Math.random().toString(36).substring(7),
};

type Action =
  | { type: 'TOGGLE_OPEN' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_MODULE'; payload: string };

function reducer(state: AIPanelState, action: Action): AIPanelState {
  switch (action.type) {
    case 'TOGGLE_OPEN':
      return { ...state, isOpen: !state.isOpen };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_INPUT':
      return { ...state, currentInput: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1
            ? { ...msg, content: msg.content + action.payload, isStreaming: true }
            : msg
        ),
      };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'SET_MODULE':
      return { ...state, selectedModule: action.payload };
    default:
      return state;
  }
}

export default function AIPanel() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { sendMessage } = useAIStreamConnection();
  const pathname = usePathname();

  useEffect(() => {
    const module = detectModuleFromPath(pathname);
    dispatch({ type: 'SET_MODULE', payload: module });
  }, [pathname]);

  const handleSend = async () => {
    if (!state.currentInput.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: state.currentInput,
      timestamp: Date.now(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_INPUT', payload: '' });
    dispatch({ type: 'SET_LOADING', payload: true });

    const assistantMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });

    await sendMessage(
      {
        message: userMsg.content,
        module: state.selectedModule || 'general',
        conversationId: state.conversationId,
      },
      (token: string) => {
        dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: token });
      }
    );

    dispatch({ type: 'SET_LOADING', payload: false });
  };

  return (
    <>
      <button
        className={styles['ai-float-button']}
        onClick={() => dispatch({ type: 'TOGGLE_OPEN' })}
        title="SymbioNexus AI (Cmd+K)"
      >
        🤖
      </button>

      {state.isOpen && (
        <div className={styles['ai-panel-window']}>
          <div style={{ fontSize: '0.75rem', padding: '8px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
            Module: <strong>{state.selectedModule}</strong>
          </div>
          <ChatWindow messages={state.messages} />
          <MessageInput
            value={state.currentInput}
            onChange={(val) => dispatch({ type: 'SET_INPUT', payload: val })}
            onSend={handleSend}
            isLoading={state.isLoading}
          />
        </div>
      )}
    </>
  );
}
