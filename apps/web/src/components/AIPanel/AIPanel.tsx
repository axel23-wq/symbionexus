'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import { AIPanelState, Message } from './types';
import { useAIStreamConnection } from './useAIStreamConnection';
import { detectModuleFromPath } from '@/lib/module-detector';
import styles from './AIPanel.module.css';

const MODULE_SUGGESTIONS: { [key: string]: string[] } = {
  marketplace: [
    'Trouver des acheteurs pour mes déchets',
    'Analyser les tendances du marché',
    'Estimer le prix de vente',
    'Optimiser ma liste de produits',
  ],
  matchmaking: [
    'Afficher les meilleurs matchs',
    'Analyser la compatibilité',
    'Proposer des partenaires',
    'Évaluer les risques',
  ],
  carbon: [
    'Calculer mon impact CO2',
    'Générer un certificat carbone',
    'Comparer avec des pairs',
    'Optimiser mes émissions',
  ],
  general: [
    'Circular Economy Trends Analysis',
    'Optimizing a Circular Ad Listing',
    'Carbon Impact Calculator',
    'Marketplace Matchmaking Insights',
  ],
};

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
  | { type: 'SET_MODULE'; payload: string }
  | { type: 'SET_DEMO_MODE'; payload: boolean };

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
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.payload };
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const module = detectModuleFromPath(pathname);
    dispatch({ type: 'SET_MODULE', payload: module });
  }, [pathname]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setDrag({
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      offset: { x: rect.left + panelPos.x, y: rect.top + panelPos.y },
    });
  };

  useEffect(() => {
    if (!drag.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - drag.startPos.x;
      const deltaY = e.clientY - drag.startPos.y;
      setPanelPos({ x: deltaX, y: deltaY });
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

  const handleDemoMode = async () => {
    setDemoMode(true);
    dispatch({ type: 'SET_DEMO_MODE', payload: true });

    const demoQuestions = [
      'Afficher les meilleurs matchs disponibles',
      'Calculer mon impact CO2 sur le dernier trimestre',
      'Analyser les tendances du marché',
    ];

    for (const question of demoQuestions) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'user',
        content: question,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: `[Réponse Auto-Pilot pour: ${question}]`,
        timestamp: Date.now(),
        isStreaming: false,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });

      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setDemoMode(false);
  };

  const handleSend = async () => {
    const msg = state.currentInput.trim();
    if (!msg) return;

    // Check for /demo-soutenance command
    if (msg === '/demo-soutenance') {
      dispatch({ type: 'SET_INPUT', payload: '' });
      await handleDemoMode();
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: msg,
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
        message: msg,
        module: state.selectedModule || 'general',
        conversationId: state.conversationId,
      },
      (token: string) => {
        dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: token });
      }
    );

    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const handleSuggestedQuestion = (question: string) => {
    dispatch({ type: 'SET_INPUT', payload: question });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToolClick = (tool: string) => {
    if (['camera', 'video', 'document'].includes(tool)) {
      fileInputRef.current?.click();
    } else if (tool === 'microphone') {
      console.log('Microphone feature coming soon');
    }
  };

  const suggestions = MODULE_SUGGESTIONS[state.selectedModule || 'general'] || MODULE_SUGGESTIONS.general;

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
          {/* Header */}
          <div
            ref={headerRef}
            className={styles['ai-panel-header']}
            onMouseDown={handleMouseDown}
          >
            <div className={styles['header-left']}>
              <span className={styles['header-icon']}>🌿</span>
              <span className={styles['header-title']}>SymbioNexus AI Assistant</span>
            </div>
            <button className={styles['header-settings']} title="Settings">⚙️</button>
          </div>

          {/* Tool Toolbar Left */}
          <div className={styles['toolbar']}>
            <div className={styles['tool']} onClick={() => handleToolClick('camera')} title="Camera">📷</div>
            <div className={styles['tool']} onClick={() => handleToolClick('video')} title="Video">🎥</div>
            <div className={styles['tool']} onClick={() => handleToolClick('document')} title="Document">📄</div>
            <div className={styles['tool']} onClick={() => handleToolClick('microphone')} title="Microphone">🎤</div>
          </div>

          {/* Chat Window */}
          <ChatWindow messages={state.messages} />

          {/* Suggested Questions */}
          {state.messages.length === 0 && (
            <div className={styles['suggested-section']}>
              <div className={styles['suggested-label']}>Suggested Questions</div>
              <div className={styles['suggestions-grid']}>
                {suggestions.slice(0, 2).map((q, idx) => (
                  <button
                    key={idx}
                    className={styles['chip']}
                    onClick={() => handleSuggestedQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className={styles['demo-hint']}>
                💡 Tip: Type <code>/demo-soutenance</code> for auto-pilot demo mode
              </div>
            </div>
          )}

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className={styles['file-preview-section']}>
              <div className={styles['fp-label']}>File Preview</div>
              <div className={styles['file-thumbs']}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className={`${styles['thumb']} ${file.type.startsWith('image/') ? styles['img'] : styles['pdf']}`}>
                    <span
                      className={styles['thumb-close']}
                      onClick={() => removeFile(idx)}
                    >
                      ×
                    </span>
                    <div className={styles['thumb-content']}>
                      {file.type.startsWith('image/') ? '🖼️' : '📄'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className={styles['input-bar']}>
            <button className={styles['round-btn']} title="Add">➕</button>
            <MessageInput
              value={state.currentInput}
              onChange={(val) => dispatch({ type: 'SET_INPUT', payload: val })}
              onSend={handleSend}
              isLoading={state.isLoading}
              placeholder="Demandez-moi n'importe quoi..."
            />
            <button className={styles['send-btn']} onClick={handleSend} disabled={state.isLoading}>
              ➤
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      )}
    </>
  );
}
