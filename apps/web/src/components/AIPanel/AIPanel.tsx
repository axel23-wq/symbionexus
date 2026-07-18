'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import FileUploadZone from './FileUploadZone';
import VoiceRecorder from './VoiceRecorder';
import AISettings from './AISettings';
import ConversationHistory from './ConversationHistory';
import { AIPanelState, Message } from './types';
import { useAIStreamConnection } from './useAIStreamConnection';
import { useConversationStorage, StoredConversation } from './useConversationStorage';
import { detectModuleFromPath } from '@/lib/module-detector';
import styles from './AIPanel.module.css';
import jsPDF from 'jspdf';

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

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

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
  | { type: 'SET_DEMO_MODE'; payload: boolean }
  | { type: 'RESET_CONVERSATION' }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_CONVERSATION_ID'; payload: string };

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
    case 'RESET_CONVERSATION':
      return {
        ...state,
        messages: [],
        currentInput: '',
        isLoading: false,
        conversationId: Math.random().toString(36).substring(7),
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload };
    default:
      return state;
  }
}

export default function AIPanel() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { sendMessage } = useAIStreamConnection();
  const { conversations, saveConversation, deleteConversation } = useConversationStorage();
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [voiceRecordingBlob, setVoiceRecordingBlob] = useState<Blob | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const module = detectModuleFromPath(pathname);
    dispatch({ type: 'SET_MODULE', payload: module });
  }, [pathname]);

  // Save conversation to history when messages change
  useEffect(() => {
    if (state.messages.length > 0) {
      saveConversation(state.conversationId, state.messages);
    }
  }, [state.messages, state.conversationId, saveConversation]);

  const handleLoadConversation = useCallback(
    (conversation: StoredConversation) => {
      dispatch({ type: 'SET_MESSAGES', payload: conversation.messages });
      dispatch({ type: 'SET_CONVERSATION_ID', payload: conversation.conversationId });
      dispatch({ type: 'SET_INPUT', payload: '' });
      setHistoryOpen(false);
    },
    []
  );

  const handleDeleteConversation = useCallback(
    (conversationId: string) => {
      deleteConversation(conversationId);
    },
    [deleteConversation]
  );

  const handleNewConversation = useCallback(() => {
    dispatch({ type: 'RESET_CONVERSATION' });
  }, []);

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

  const handleFilesSelected = (files: Array<{ file: File; preview?: string; type: 'image' | 'video' | 'audio' | 'document' | 'other' }>) => {
    setUploadedFiles(files as UploadedFile[]);
  };

  const removeFile = (idx: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx);
    setUploadedFiles(updated);
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    setVoiceRecordingBlob(audioBlob);
    dispatch({ type: 'SET_INPUT', payload: '[Voice message attached]' });
  };

  const handleToolClick = (tool: string) => {
    if (tool === 'microphone') {
      // Voice recorder is now integrated, this is handled by the component
    } else if (['camera', 'video', 'document'].includes(tool)) {
      setShowFileUpload(true);
    }
  };

  const exportToTXT = () => {
    const content = state.messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      conversationId: state.conversationId,
      messageCount: state.messages.length,
      messages: state.messages,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Title
      pdf.setFontSize(16);
      pdf.text('SymbioNexus AI Conversation', margin, yPosition);
      yPosition += 10;

      // Metadata
      pdf.setFontSize(10);
      pdf.text(
        `Exported: ${new Date().toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 5;
      pdf.text(
        `Messages: ${state.messages.length}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Messages
      pdf.setFontSize(11);
      state.messages.forEach((msg) => {
        const roleLabel = `${msg.role.toUpperCase()}:`;
        const lines = pdf.splitTextToSize(
          `${roleLabel}\n${msg.content}`,
          maxWidth
        );

        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 4;
      });

      pdf.save(
        `conversation-${new Date().toISOString().split('T')[0]}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleExport = (format: 'pdf' | 'txt' | 'json') => {
    if (state.messages.length === 0) {
      alert('No messages to export');
      return;
    }

    switch (format) {
      case 'pdf':
        exportToPDF();
        break;
      case 'txt':
        exportToTXT();
        break;
      case 'json':
        exportToJSON();
        break;
    }
  };

  const handleClearHistory = () => {
    dispatch({ type: 'RESET_CONVERSATION' });
    setSettingsOpen(false);
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
          {/* History Toggle Button */}
          <button
            className={styles['history-toggle']}
            onClick={() => setHistoryOpen(!historyOpen)}
            title={historyOpen ? 'Close history' : 'Open history'}
            aria-label="Toggle conversation history"
          >
            ≡
          </button>

          {/* Conversation History Sidebar */}
          <ConversationHistory
            conversations={conversations}
            isOpen={historyOpen}
            onToggle={() => setHistoryOpen(!historyOpen)}
            onLoadConversation={handleLoadConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
          />

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
            <button
              className={styles['header-settings']}
              title="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              ⚙️
            </button>
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

          {/* File Upload Zone Overlay */}
          {showFileUpload && (
            <div className={styles['file-upload-overlay']}>
              <button
                className={styles['overlay-close']}
                onClick={() => setShowFileUpload(false)}
              >
                ✕
              </button>
              <FileUploadZone onFilesSelected={handleFilesSelected} maxSize={100} maxFiles={10} />
            </div>
          )}

          {/* File Preview Section */}
          {uploadedFiles.length > 0 && (
            <div className={styles['file-preview-section']}>
              <div className={styles['fp-label']}>Files Attached ({uploadedFiles.length})</div>
              <div className={styles['file-thumbs']}>
                {uploadedFiles.map((fileItem, idx) => (
                  <div key={idx} className={`${styles['thumb']} ${styles[fileItem.type]}`}>
                    {fileItem.preview ? (
                      <img src={fileItem.preview} alt="preview" className={styles['thumb-image']} />
                    ) : (
                      <span className={styles['thumb-icon']}>
                        {fileItem.type === 'image' && '🖼️'}
                        {fileItem.type === 'video' && '🎬'}
                        {fileItem.type === 'audio' && '🎵'}
                        {fileItem.type === 'document' && '📄'}
                        {fileItem.type === 'other' && '📎'}
                      </span>
                    )}
                    <span
                      className={styles['thumb-close']}
                      onClick={() => removeFile(idx)}
                      title="Remove file"
                    >
                      ×
                    </span>
                    <div className={styles['file-size']}>
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Recorder Section */}
          <div className={styles['voice-section']}>
            <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} isLoading={state.isLoading} />
          </div>

          {/* Input Bar */}
          <div className={styles['input-bar']}>
            <button
              className={styles['round-btn']}
              title="Add files"
              onClick={() => setShowFileUpload(!showFileUpload)}
            >
              📁
            </button>
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
        </div>
      )}

      {/* Settings Modal */}
      <AISettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onExport={handleExport}
        onClearHistory={handleClearHistory}
        messages={state.messages}
      />
    </>
  );
}
