import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Heart, Trash2, Reply, Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';

const QUICK_EMOJIS = ['❤️','😂','🔥','✨','😮','👍','🙏','🥺','😭','💀'];

export default function NGLPage() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showReact, setShowReact] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState<number | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/ngl');
      if (res.ok) setMessages(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/ngl', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) { setInput(''); fetchMessages(); }
    } catch { toast({ title: 'Gagal kirim', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const reactToMessage = async (msgId: number, emoji: string) => {
    if (!user) return;
    setShowReact(null);
    await fetch(`/api/ngl/${msgId}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, emoji }),
    });
    fetchMessages();
  };

  const addComment = async (msgId: number) => {
    if (!replyText.trim() || !user) return;
    await fetch(`/api/ngl/${msgId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, content: replyText.trim() }),
    });
    setReplyText(''); setShowReply(null);
    fetchMessages();
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Hapus pesan ini?')) return;
    await fetch(`/api/ngl/${id}`, { method: 'DELETE' });
    fetchMessages();
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
      {/* Send NGL */}
      <div className="glass rounded-3xl p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">💌</div>
          <h2 className="font-serif text-2xl font-bold">NGL Universe Moon</h2>
          <p className="text-muted-foreground text-sm mt-1">Kirim pesan anonim ke Universe Moon! Tidak ada yang tahu itu kamu.</p>
        </div>
        <form onSubmit={sendMessage} className="space-y-3">
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Tulis pesan anonim kamu di sini... 💬"
            rows={3} maxLength={500}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{input.length}/500</span>
            <button type="submit" disabled={!input.trim() || sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl font-semibold text-sm disabled:opacity-50">
              <Send className="w-4 h-4" /> {sending ? 'Mengirim...' : 'Kirim Anonim'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Identitasmu terlindungi. Kirim dengan bebas!
          </p>
        </form>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Pesan Masuk ({messages.length})
        </h3>
        {messages.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada pesan. Jadilah yang pertama!</p>
          </div>
        )}
        {messages.map((msg: any) => {
          const reactions: Record<string, string[]> = msg.reactions || {};
          const comments: any[] = msg.comments || [];
          const totalReacts = Object.values(reactions).reduce((a, b) => a + b.length, 0);
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all"
              onClick={() => setShowReact(null)}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Anonim</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin can see
                    </span>
                    <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-destructive hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed mb-3">{msg.content}</p>

              {/* Reactions display */}
              {totalReacts > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(reactions).map(([emoji, users]) => (
                    <button key={emoji} onClick={() => !isGuest && user && reactToMessage(msg.id, emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                        users.includes(user?.username || '') ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}>
                      <span>{emoji}</span><span className="text-muted-foreground">{users.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                {!isGuest && (
                  <>
                    <div className="relative">
                      <button onClick={e => { e.stopPropagation(); setShowReact(showReact === msg.id ? null : msg.id); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                        <Heart className="w-3.5 h-3.5" /> React
                      </button>
                      <AnimatePresence>
                        {showReact === msg.id && (
                          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            className="absolute bottom-full left-0 mb-2 z-20 bg-black/90 border border-white/20 rounded-2xl p-2 flex gap-1"
                            onClick={e => e.stopPropagation()}>
                            {QUICK_EMOJIS.map(emoji => (
                              <button key={emoji} onClick={() => reactToMessage(msg.id, emoji)}
                                className="text-lg hover:scale-125 transition-transform p-0.5">{emoji}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setShowReply(showReply === msg.id ? null : msg.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                      <Reply className="w-3.5 h-3.5" /> Balas
                    </button>
                  </>
                )}
                {comments.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">{comments.length} komentar</span>
                )}
              </div>

              {/* Reply box */}
              {showReply === msg.id && !isGuest && (
                <div className="mt-3 flex gap-2">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Tulis balasan..." onKeyDown={e => e.key === 'Enter' && addComment(msg.id)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary" />
                  <button onClick={() => addComment(msg.id)} disabled={!replyText.trim()}
                    className="px-3 py-2 bg-primary/20 border border-primary/30 rounded-xl text-xs disabled:opacity-50">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Comments */}
              {comments.length > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
                  {comments.map((c: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {c.username?.substring(0,1).toUpperCase()}
                      </div>
                      <div className="bg-white/5 rounded-xl px-3 py-2 flex-1">
                        <p className="text-xs font-semibold text-primary">{c.username}</p>
                        <p className="text-xs text-muted-foreground">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
