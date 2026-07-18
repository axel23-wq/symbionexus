'use client';

import React, { useState, useMemo } from 'react';
import {
  StoredConversation,
  formatRelativeTime,
} from './useConversationStorage';
import styles from './ConversationHistory.module.css';

interface ConversationHistoryProps {
  conversations: StoredConversation[];
  isOpen: boolean;
  onToggle: () => void;
  onLoadConversation: (conversation: StoredConversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ConversationHistory({
  conversations,
  isOpen,
  onToggle,
  onLoadConversation,
  onDeleteConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        )
    );
  }, [conversations, searchQuery]);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${styles['history-sidebar']} ${isOpen ? styles['open'] : ''}`}
      >
        {/* Header */}
        <div className={styles['sidebar-header']}>
          <div className={styles['sidebar-title']}>
            <span className={styles['history-icon']}>📝</span>
            <span>History</span>
          </div>
          <button
            className={styles['close-btn']}
            onClick={onToggle}
            title="Close"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          className={styles['new-conversation-btn']}
          onClick={() => {
            onNewConversation();
            onToggle();
          }}
          title="Start a new conversation"
        >
          <span className={styles['btn-icon']}>➕</span>
          <span className={styles['btn-text']}>New Chat</span>
        </button>

        {/* Conversation Count */}
        {conversations.length > 0 && (
          <div className={styles['conversation-count']}>
            {filteredConversations.length} of {conversations.length}
          </div>
        )}

        {/* Search */}
        {conversations.length > 0 && (
          <div className={styles['search-container']}>
            <input
              type="text"
              className={styles['search-input']}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                className={styles['clear-search']}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className={styles['conversations-list']}>
          {filteredConversations.length === 0 ? (
            <div className={styles['empty-state']}>
              <span className={styles['empty-icon']}>📭</span>
              <span className={styles['empty-text']}>
                {conversations.length === 0
                  ? 'No conversations yet'
                  : 'No results found'}
              </span>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={styles['conversation-item']}
                onMouseEnter={() => setHoveredId(conversation.conversationId)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Main Content Area */}
                <button
                  className={styles['conversation-content']}
                  onClick={() => onLoadConversation(conversation)}
                  title={conversation.title}
                >
                  <div className={styles['conv-title']}>{conversation.title}</div>
                  <div className={styles['conv-meta']}>
                    <span className={styles['conv-time']}>
                      {formatRelativeTime(conversation.timestamp)}
                    </span>
                    <span className={styles['conv-count']}>
                      {conversation.messages.length} messages
                    </span>
                  </div>
                </button>

                {/* Delete Button */}
                {hoveredId === conversation.conversationId && (
                  <button
                    className={styles['delete-btn']}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          'Delete this conversation? This cannot be undone.'
                        )
                      ) {
                        onDeleteConversation(conversation.conversationId);
                      }
                    }}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay (mobile/when open) */}
      {isOpen && (
        <div
          className={styles['history-overlay']}
          onClick={onToggle}
        />
      )}
    </>
  );
}
