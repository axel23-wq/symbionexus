'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
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

interface DragState {
  isDragging: boolean;
  offset: { x: number; y: number };
  startPos: { x: number; y: number };
}

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
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const module = detectModuleFromPath(pathname);
    dispatch({ type: 'SET_MODULE', payload: module });
  }, [pathname]);

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDrag({
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      offset: { x: rect.left + panelPos.x, y: rect.top + panelPos.y },
    });
  };

  // Mouse move handler
  useEffect(() => {
    if (!drag.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - drag.startPos.x;
      const deltaY = e.clientY - drag.startPos.y;

      setPanelPos({
        x: deltaX,
        y: deltaY,
      });
    };

    const handleMouseUp = () => {
      setDrag({ ...drag, isDragging: false });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag]);

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
        ref={buttonRef}
        className={styles['ai-float-button']}
        onClick={() => dispatch({ type: 'TOGGLE_OPEN' })}
        title="SymbioNexus AI (Cmd+K)"
      >
        🤖
      </button>

      {state.isOpen && (
        <div
          ref={panelRef}
          className={styles['ai-panel-window']}
          style={{
            transform: `translate(${panelPos.x}px, ${panelPos.y}px)`,
            transition: drag.isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            ref={headerRef}
            className={styles['ai-panel-header']}
            onMouseDown={handleMouseDown}
          >
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
