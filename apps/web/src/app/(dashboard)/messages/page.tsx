'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const result = await api.getConversations();
      setConversations(result.data || []);
      if (!activePartnerId && result.data?.length > 0) {
        setActivePartnerId(result.data[0].partnerId);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [activePartnerId]);

  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      const result = await api.getConversation(partnerId);
      setMessages(result.data || []);
      // Mark as read
      await api.request(`/messages/read/${partnerId}`, { method: 'PATCH' });
    } catch (err) { console.error(err); }
  }, []);

  // Load conversation list once on mount.
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId);
    }
  }, [activePartnerId, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    try {
      await api.sendMessage(activePartnerId, newMessage);
      setNewMessage('');
      loadMessages(activePartnerId);
      loadConversations();
    } catch (err) { console.error(err); }
  };

  const activePartner = conversations.find(c => c.partnerId === activePartnerId);

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '16px', paddingBottom: '16px' }}>
        <div>
          <h1 className="page-title">💬 Messagerie</h1>
          <p className="page-subtitle">Échangez avec vos partenaires commerciaux</p>
        </div>
      </div>

      <div className="neo-card" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar (Conversations) */}
        <div style={{ width: '320px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--color-bg-base)' }}>
            <input type="text" className="input-field" placeholder="Rechercher..." style={{ padding: '10px 16px' }} />
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chargement...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Aucune conversation
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  onClick={() => setActivePartnerId(conv.partnerId)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: activePartnerId === conv.partnerId ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                    display: 'flex', gap: '12px', alignItems: 'center',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                    {conv.partnerName.substring(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.partnerName}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: conv.unreadCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: conv.unreadCount > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-primary-500)', color: 'white', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
          {activePartnerId ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--color-bg-card)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                  {activePartner?.partnerName.substring(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{activePartner?.partnerName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-400)' }}>Entreprise vérifiée</div>
                </div>
              </div>

              {/* Messages List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg) => {
                  const isMe = msg.senderCompanyId === user?.companyId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'var(--gradient-primary)' : 'var(--color-bg-elevated)',
                        color: isMe ? 'white' : 'var(--color-text-primary)',
                        border: isMe ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                      }}>
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.content}</div>
                        <div style={{ fontSize: '0.7rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--color-bg-card)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" disabled={!newMessage.trim()} style={{ padding: '0 24px' }}>
                    Envoyer
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '4rem' }}>💬</div>
              <p>Sélectionnez une conversation pour commencer à échanger</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
