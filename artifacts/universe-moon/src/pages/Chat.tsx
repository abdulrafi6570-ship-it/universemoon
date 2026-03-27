import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { formatTime } from '@/lib/utils';
import { Send, Smile, Trash2, Reply, Image, X, MessageCircle, Lock, Users } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_EMOJIS = ['❤️','😂','😮','😢','😡','👍','🔥','✨','🙏','😍'];

function Avatar({ name, src, size = 8 }: { name: string; src?: string; size?: number }) {
  if (src) return <img src={src} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
  const colors = ['bg-purple-500/30','bg-blue-500/30','bg-green-500/30','bg-yellow-500/30','bg-pink-500/30','bg-cyan-500/30'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-xs font-bold shrink-0`}>
      {name.substring(0,2).toUpperCase()}
    </div>
  );
}

export default function Chat() {
  const { user, isGuest } = useAuthStore();
  const { playSfx } = useSound();
  const { toast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showEmoji, setShowEmoji] = useState<number | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [dmPartner, setDmPartner] = useState<any>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [showDmList, setShowDmList] = useState(false);
  const [tab, setTab] = useState<'group'|'dm'>('group');
  const endRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, []);

  const fetchStickers = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/stickers');
      if (res.ok) setStickers(await res.json());
    } catch {}
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members?active=true');
      if (res.ok) setMembers(await res.json());
    } catch {}
  }, []);

  const fetchDmMessages = useCallback(async (partner: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat/dm/${user.username}/${partner}`);
      if (res.ok) setDmMessages(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchMessages(); fetchStickers(); fetchMembers();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (dmPartner) {
      fetchDmMessages(dmPartner);
      const id = setInterval(() => fetchDmMessages(dmPartner), 3000);
      return () => clearInterval(id);
    }
  }, [dmPartner, fetchDmMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, dmMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGuest || !user) return;
    const msg = input.trim();
    setInput('');
    setReplyTo(null);
    playSfx('message');
    try {
      if (tab === 'dm' && dmPartner) {
        await fetch('/api/chat/dm', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromUsername: user.username, toUsername: dmPartner, content: msg }),
        });
        fetchDmMessages(dmPartner);
      } else {
        await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: user.username, content: msg,
            replyToId: replyTo?.id || null,
            replyToContent: replyTo?.content || null,
          }),
        });
        fetchMessages();
      }
    } catch (err) { toast({ title: 'Gagal kirim', variant: 'destructive' }); }
  };

  const handleSendSticker = async (sticker: any) => {
    if (!user || isGuest) return;
    setShowStickers(false);
    playSfx('message');
    await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: user.username, content: '', isSticker: true, stickerCode: sticker.fileUrl }),
    });
    fetchMessages();
  };

  const handleReact = async (msgId: number, emoji: string) => {
    if (!user || isGuest) return;
    setShowEmoji(null);
    await fetch(`/api/chat/${msgId}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, emoji }),
    });
    fetchMessages();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pesan ini?')) return;
    await fetch(`/api/chat/${id}`, { method: 'DELETE' });
    fetchMessages();
  };

  const displayMessages = tab === 'dm' ? dmMessages : messages;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3 animate-in fade-in">
      {/* DM List Sidebar */}
      <AnimatePresence>
        {showDmList && (
          <motion.div initial={{ x: -200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -200, opacity: 0 }}
            className="w-56 glass rounded-2xl flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pesan Pribadi</span>
              <button onClick={() => setShowDmList(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {members.filter(m => m.name !== user?.username).map(m => (
                <button key={m.id} onClick={() => { setDmPartner(m.name); setTab('dm'); setShowDmList(false); }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left hover:bg-white/10 transition-colors text-sm ${dmPartner === m.name ? 'bg-white/10' : ''}`}>
                  <Avatar name={m.name} src={m.avatarUrl} size={6} />
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col glass rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {tab === 'dm' && dmPartner ? (
              <>
                <button onClick={() => { setTab('group'); setDmPartner(null); }} className="p-1 hover:bg-white/10 rounded-lg">
                  <Reply className="w-4 h-4 rotate-180" />
                </button>
                <Avatar name={dmPartner} size={8} />
                <div>
                  <p className="font-semibold text-sm">{dmPartner}</p>
                  <p className="text-[10px] text-muted-foreground">Pesan Pribadi</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Universe Chat</p>
                  <p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Live</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDmList(!showDmList)} className="p-2 rounded-xl hover:bg-white/10 transition-colors" title="Pesan Pribadi">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar" onClick={() => setShowEmoji(null)}>
          {displayMessages.map((msg: any, i: number) => {
            const sender = msg.sender || msg.fromUsername;
            const isMe = sender === user?.username;
            const prevMsg = displayMessages[i - 1];
            const prevSender = prevMsg ? (prevMsg.sender || prevMsg.fromUsername) : null;
            const showAvatar = !isMe && sender !== prevSender;
            const isSticker = msg.isSticker;
            const reactions = msg.reactions as Record<string, string[]> || {};

            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${sender !== prevSender ? 'mt-3' : 'mt-0.5'}`}>
                {!isMe && (
                  <div className="w-8 shrink-0">
                    {showAvatar && <Avatar name={sender} size={8} />}
                  </div>
                )}

                <div className={`flex flex-col max-w-[70%] group relative ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                    <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium">{sender}</span>
                  )}

                  {/* Reply preview */}
                  {msg.replyToContent && (
                    <div className={`text-[10px] text-muted-foreground border-l-2 border-primary/50 pl-2 mb-1 max-w-[200px] truncate ${isMe ? 'text-right' : ''}`}>
                      {msg.replyToContent}
                    </div>
                  )}

                  <div className="relative">
                    {isSticker ? (
                      <img src={msg.stickerCode} alt="sticker" className="w-24 h-24 object-contain rounded-xl" />
                    ) : (
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-br from-indigo-600/80 to-purple-600/80 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm text-white'
                      }`}>
                        {msg.content}
                      </div>
                    )}

                    {/* Action buttons on hover */}
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-1`}>
                      <button onClick={(e) => { e.stopPropagation(); setShowEmoji(showEmoji === msg.id ? null : msg.id); }}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-xs">
                        <Smile className="w-3 h-3" />
                      </button>
                      {!isGuest && (
                        <button onClick={() => setReplyTo(msg)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-xs">
                          <Reply className="w-3 h-3" />
                        </button>
                      )}
                      {(isAdmin || isMe) && (
                        <button onClick={() => handleDelete(msg.id)}
                          className="p-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-xs">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Emoji Picker */}
                    {showEmoji === msg.id && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} z-20 bg-black/90 border border-white/20 rounded-2xl p-2 flex gap-1`}
                        onClick={e => e.stopPropagation()}>
                        {QUICK_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform p-1">
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {Object.keys(reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(reactions).map(([emoji, users]) => (
                        <button key={emoji} onClick={() => !isGuest && handleReact(msg.id, emoji)}
                          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            users.includes(user?.username || '') 
                              ? 'bg-primary/30 border-primary/50' 
                              : 'bg-white/10 border-white/10 hover:bg-white/20'
                          }`}>
                          <span>{emoji}</span>
                          <span className="text-muted-foreground">{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-muted-foreground mt-1 mx-1">{formatTime(msg.createdAt)}</span>
                </div>
              </motion.div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Sticker Panel */}
        <AnimatePresence>
          {showStickers && stickers.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 140, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 bg-black/40 overflow-y-auto">
              <div className="p-3 flex flex-wrap gap-2">
                {stickers.map((s: any) => (
                  <button key={s.id} onClick={() => handleSendSticker(s)} className="hover:scale-110 transition-transform">
                    <img src={s.fileUrl} alt={s.name} className="w-16 h-16 object-contain rounded-lg" />
                  </button>
                ))}
                {stickers.length === 0 && <p className="text-xs text-muted-foreground">Belum ada stiker. Admin bisa tambah via pengaturan.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-3 bg-black/50 border-t border-white/10 backdrop-blur-md shrink-0">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-white/5 rounded-xl border-l-2 border-primary">
              <span className="text-xs text-muted-foreground truncate">↩ {replyTo.sender}: {replyTo.isSticker ? '🖼️ Stiker' : replyTo.content}</span>
              <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
            </div>
          )}
          {isGuest ? (
            <div className="text-center text-sm text-muted-foreground py-2 italic flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Guest tidak dapat mengirim pesan
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <button type="button" onClick={() => setShowStickers(!showStickers)}
                className={`p-2.5 rounded-xl transition-colors ${showStickers ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white bg-white/5'}`}>
                <Image className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-white/8 border border-white/12 rounded-2xl px-4 py-2.5 text-sm focus-within:border-primary/50 transition-colors">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  placeholder={tab === 'dm' ? `Kirim ke ${dmPartner}...` : "Ketik pesan..."}
                  rows={1}
                  className="w-full bg-transparent focus:outline-none resize-none"
                  style={{ maxHeight: 100 }}
                />
              </div>
              <button type="submit" disabled={!input.trim()}
                className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
