import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, CheckCircle, Lock, Send, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';

export default function Voting() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [openCreate, setOpenCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);

  // Guest name: stored in localStorage, passed explicitly to avoid stale closure
  const [guestName, setGuestName] = useState(() => localStorage.getItem('um_guest_name') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pendingAction, setPendingAction] = useState<((name: string) => void) | null>(null);

  const effectiveName = user?.username || (guestName ? `Tamu_${guestName}` : '');

  const requireName = (action: (name: string) => void) => {
    if (effectiveName) {
      action(effectiveName);
    } else {
      setPendingAction(() => action);
      setShowNamePrompt(true);
    }
  };

  const confirmGuestName = () => {
    const saved = nameInput.trim();
    if (!saved) return;
    const fullName = `Tamu_${saved}`;
    localStorage.setItem('um_guest_name', saved);
    setGuestName(saved);
    setShowNamePrompt(false);
    setNameInput('');
    if (pendingAction) {
      pendingAction(fullName);
      setPendingAction(null);
    }
  };

  const { data: polls = [] } = useQuery({
    queryKey: ['polls'],
    queryFn: () => fetch('/api/polls').then(r => r.json()),
    refetchInterval: 10000,
  });

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      return toast({ title: 'Pertanyaan dan minimal 2 pilihan wajib diisi!', variant: 'destructive' });
    }
    const res = await fetch('/api/polls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim(), options: validOptions, createdBy: user?.username }),
    });
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['polls'] });
      setOpenCreate(false); setQuestion(''); setOptions(['', '']);
      toast({ title: 'Voting berhasil dibuat!' });
    }
  };

  const doVote = async (pollId: number, optionIndex: number, name: string) => {
    await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, optionIndex }),
    });
    qc.invalidateQueries({ queryKey: ['polls'] });
  };

  const handleVote = (pollId: number, optionIndex: number) => {
    requireName((name) => doVote(pollId, optionIndex, name));
  };

  const doComment = async (pollId: number, name: string) => {
    const content = commentInputs[pollId]?.trim();
    if (!content) return;
    setSubmittingComment(pollId);
    await fetch(`/api/polls/${pollId}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, content }),
    });
    setCommentInputs(p => ({ ...p, [pollId]: '' }));
    qc.invalidateQueries({ queryKey: ['polls'] });
    setSubmittingComment(null);
  };

  const handleComment = (pollId: number) => {
    requireName((name) => doComment(pollId, name));
  };

  const handleDelete = async (pollId: number) => {
    if (!confirm('Hapus voting ini?')) return;
    await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
    qc.invalidateQueries({ queryKey: ['polls'] });
  };

  const toggleComments = (pollId: number) => {
    setExpandedComments(prev => {
      const n = new Set(prev);
      n.has(pollId) ? n.delete(pollId) : n.add(pollId);
      return n;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      {/* Guest name prompt modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNamePrompt(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass rounded-3xl p-6 w-full max-w-sm border border-white/20">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-center mb-1">Siapa namamu?</h3>
                <p className="text-xs text-muted-foreground text-center mb-4">Nama ini untuk vote &amp; komentar kamu.</p>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmGuestName()}
                  placeholder="Masukkan nama kamu..."
                  autoFocus
                  className="w-full mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowNamePrompt(false)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm hover:bg-white/10">Batal</button>
                  <button
                    onClick={confirmGuestName}
                    disabled={!nameInput.trim()}
                    className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-semibold disabled:opacity-50"
                  >Lanjutkan</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold">Voting &amp; Polling</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Suarakan pendapatmu untuk Universe Moon!
            {guestName && <span className="ml-2 text-xs text-primary/80">Hai, Tamu_{guestName}!</span>}
          </p>
        </div>
        {user && !isGuest && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-sm font-semibold hover:bg-primary/30 transition-colors">
                <Plus className="w-4 h-4" /> Buat Voting
              </button>
            </DialogTrigger>
            <DialogContent className="glass border border-white/20 max-w-md">
              <DialogHeader><DialogTitle>Buat Voting Baru</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Tuliskan pertanyaanmu..." rows={3} maxLength={300}
                  className="w-full resize-none" />
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Pilihan Jawaban</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                        placeholder={`Pilihan ${i + 1}`} maxLength={100} className="flex-1" />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(p => p.filter((_, j) => j !== i))} className="p-2 text-destructive hover:bg-red-900/20 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button onClick={() => setOptions(p => [...p, ''])} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Tambah pilihan
                    </button>
                  )}
                </div>
                <button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                  className="w-full py-3 bg-white text-black rounded-xl font-semibold disabled:opacity-50">
                  Buat Voting
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Guest banner */}
      {!effectiveName && (
        <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
          <User className="w-5 h-5 text-muted-foreground shrink-0" />
          <p className="flex-1 text-sm text-muted-foreground">Kamu bisa vote &amp; komentar sebagai tamu tanpa login!</p>
          <button onClick={() => setShowNamePrompt(true)} className="px-4 py-1.5 bg-white/10 rounded-xl text-sm hover:bg-white/20 shrink-0">
            Masuk Nama
          </button>
        </div>
      )}

      {polls.length === 0 && (
        <div className="glass rounded-2xl p-16 text-center">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada voting. Buat yang pertama!</p>
        </div>
      )}

      <div className="space-y-5">
        {polls.map((poll: any) => {
          const opts: any[] = poll.options || [];
          const totalVotes = opts.reduce((s: number, o: any) => s + (o.votes?.length || 0), 0);
          const myVoteIndex = opts.findIndex((o: any) => o.votes?.includes(effectiveName));
          const hasVoted = myVoteIndex >= 0;
          const comments: any[] = poll.comments || [];
          const showComments = expandedComments.has(poll.id);

          return (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl overflow-hidden border border-white/10">
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-base leading-snug">{poll.question}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">by {poll.createdBy || 'Admin'}</span>
                      <span className="text-xs text-muted-foreground">{totalVotes} suara</span>
                      {!poll.isOpen && (
                        <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Ditutup
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(poll.id)} className="p-1.5 text-destructive hover:bg-red-900/20 rounded-lg shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {opts.map((opt: any, idx: number) => {
                    const voteCount = opt.votes?.length || 0;
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isMyVote = myVoteIndex === idx;

                    return (
                      <button key={idx}
                        onClick={() => poll.isOpen && handleVote(poll.id, idx)}
                        disabled={!poll.isOpen}
                        className={`w-full text-left rounded-2xl overflow-hidden border transition-all relative ${
                          isMyVote ? 'border-primary/60 bg-primary/10' : 'border-white/10 hover:border-white/25'
                        } ${!poll.isOpen ? 'cursor-default' : 'cursor-pointer'}`}>
                        {hasVoted && (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className={`h-full ${isMyVote ? 'bg-primary/20' : 'bg-white/5'}`}
                            />
                          </div>
                        )}
                        <div className="relative flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isMyVote && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          {hasVoted && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{voteCount}</span>
                              <span className="font-bold text-white/80">{pct}%</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments */}
              <div className="border-t border-white/10">
                <button onClick={() => toggleComments(poll.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> {comments.length} komentar
                  </span>
                  {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showComments && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-4 space-y-3">
                        {comments.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">Belum ada komentar. Jadilah yang pertama!</p>
                        )}
                        {comments.map((c: any, i: number) => (
                          <div key={i} className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {c.username?.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="bg-white/5 rounded-2xl px-3 py-2.5 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-primary">{c.username}</span>
                                {c.createdAt && <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>}
                              </div>
                              <p className="text-sm leading-relaxed">{c.content}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 mt-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                            {effectiveName ? effectiveName.substring(0, 1).toUpperCase() : '?'}
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              value={commentInputs[poll.id] || ''}
                              onChange={e => setCommentInputs(p => ({ ...p, [poll.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleComment(poll.id)}
                              onFocus={() => !effectiveName && requireName(() => {})}
                              placeholder={effectiveName ? "Tulis komentar..." : "Klik untuk komentar sebagai tamu..."}
                              className="flex-1 !py-2 !px-3"
                            />
                            <button
                              onClick={() => handleComment(poll.id)}
                              disabled={!commentInputs[poll.id]?.trim() || submittingComment === poll.id}
                              className="p-2 bg-primary/20 hover:bg-primary/30 rounded-xl disabled:opacity-50 transition-colors shrink-0">
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
