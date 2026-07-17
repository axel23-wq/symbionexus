'use client';

import { useRef } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Votre question...',
}: MessageInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        padding: '12px',
        display: 'flex',
        gap: '8px',
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '8px',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          resize: 'none',
          minHeight: '36px',
          maxHeight: '100px',
        }}
        disabled={isLoading}
      />
      <button
        onClick={onSend}
        disabled={isLoading || !value.trim()}
        style={{
          padding: '8px 12px',
          background: isLoading ? '#888' : 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
        }}
      >
        {isLoading ? '...' : '→'}
      </button>
    </div>
  );
}
