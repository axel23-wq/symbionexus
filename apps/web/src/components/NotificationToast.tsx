'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';

export default function NotificationToast() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<any | null>(null);

  useEffect(() => {
    let socket: Socket;
    
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
        socket = io(`${baseUrl}/notifications`, {
          query: { token },
        });

        socket.on('new_notification', (data) => {
          console.log('Real-time notification received:', data);
          setNotification(data);
          
          // Hide after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        });
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  if (!notification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        boxShadow: 'var(--shadow-glow)',
        zIndex: 9999,
        maxWidth: '320px',
        animation: 'slideIn 0.3s ease-out forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            background: 'var(--gradient-primary)',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          🔔
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600 }}>
            {notification.title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {notification.message}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
