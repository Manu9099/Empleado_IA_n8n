import React, { useState, useEffect, useRef } from 'react';
import { sendChat, uploadImage, getHistory } from '../api/client';
import './Chat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
}

interface Props {
  token: string;
  userName: string;
  businessName: string;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export default function Chat({ token, userName, businessName, onLogout ,onOpenProfile,
 }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getHistory(token).then((hist: Message[]) => {
      if (hist.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `¡Hola ${userName}! Soy tu asistente para ${businessName}. ¿En qué te puedo ayudar hoy?`,
        }]);
      } else {
        setMessages(hist);
      }
    }).catch(() => {
      setMessages([{
        role: 'assistant',
        content: `¡Hola ${userName}! Soy tu asistente para ${businessName}. ¿En qué te puedo ayudar hoy?`,
      }]);
    });
  }, [token, userName, businessName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await sendChat(token, text);
      const reply = res.reply || res.output || 'Sin respuesta';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, { role: 'user', content: '📎 Imagen enviada', image_url: localUrl }]);
    try {
      const res = await uploadImage(token, file);
      const enhanced = res.enhanced_url || res.original_url || null;
      const reply = await sendChat(token, 'Mejoré esta imagen', enhanced);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply.reply || reply.output || 'Imagen procesada',
        image_url: enhanced,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar la imagen.' }]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">{businessName[0]?.toUpperCase()}</div>
          <div>
            <div className="chat-business">{businessName}</div>
            <div className="chat-status">Asistente IA · En línea</div>
          </div>
        </div>
         <button className="profile-btn" onClick={onOpenProfile}>Perfil</button>
        <button className="logout-btn" onClick={onLogout}>Salir</button>
       
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble-wrapper ${msg.role}`}>
            <div className={`bubble ${msg.role}`}>
              {msg.image_url && msg.image_url !== 'null' && (
                <img src={msg.image_url} alt="adjunto" className="bubble-img" />
              )}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="bubble-wrapper assistant">
            <div className="bubble assistant typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <button className="attach-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? '⏳' : '📎'}
        </button>
        <input type="file" ref={fileRef} accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
        <textarea
          className="chat-input"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>➤</button>
      </div>
    </div>
  );
}
