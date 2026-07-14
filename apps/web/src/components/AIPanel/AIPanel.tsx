'use client';

import { useState, useReducer } from 'react';
import ChatWindow from './ChatWindow';
import { AIPanelState, Message } from './types';
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
  | { type: 'CLEAR_MESSAGES' };

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
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    default:
      return state;
  }
}

export default function AIPanel() {
  const [state, dispatch] = useReducer(reducer, initialState);

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

    // TODO: Call backend in Task 4

    dispatch({ type: 'SET_LOADING', payload: false });
  };

  return (
    <>
      <button
        className={styles['ai-float-button']}
        onClick={() => dispatch({ type: 'TOGGLE_OPEN' })}
      >
        🤖
      </button>

      {state.isOpen && (
        <div className={styles['ai-panel-window']}>
          <ChatWindow messages={state.messages} />
        </div>
      )}
    </>
  );
}
