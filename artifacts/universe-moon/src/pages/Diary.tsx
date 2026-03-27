import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, BookHeart, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const REACTION_EMOJIS = ['❤️', '🥰', '😭', '😂', '✨', '👏'];

export default function Diary() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answerTexts, setAnswerTexts] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: diaries = [], isLoading } = useQuery({
    queryKey: ['diary'],
    queryFn: () => fetch('/api/diary').then(r => r.json()),
  });

  const addQuestionMutation = useMutation({
    mutationFn: () => fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, createdBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary'] });
      setQuestion(''); setShowForm(false);
      toast({ title: '📓 Pertanyaan diary ditambahkan!' });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: ({ diaryId, content }: { diaryId: number; content: string }) => fetch(`/api/diary/${diaryId}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, content }),
    }).then(r => r.json()),
    onSuccess: (_, { diaryId }) => {
      qc.invalidateQueries({ queryKey: ['diary'] });
      setAnswerTexts(prev => ({ ...prev, [diaryId]: '' }));
      toast({ title: '✅ Jawaban dikirim!' });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ entryId, emoji }: { entryId: number; emoji: string }) => fetch(`/api/diary/entries/${entryId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, emoji }),
    }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
  });

  const sorted = [...(diaries as any[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><BookHeart className="w-7 h-7" /> Mini Diary Grup</h1>
          <p className="text-muted-foreground text-sm mt-1">Jawab pertanyaan harian bersama-sama 💜</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Pertanyaan
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tambah Pertanyaan Diary</h2>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Pertanyaan untuk hari ini..." className="um-input w-full h-24 resize-none mb-3" />
          <div className="flex gap-2">
            <button onClick={() => addQuestionMutation.mutate()} disabled={!question.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Post Pertanyaan</button>
            <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
          </div>
        </div>
      )}

      {!user && (
        <div className="glass rounded-2xl p-4 mb-6 text-center text-sm text-muted-foreground">
          Login untuk ikut menjawab pertanyaan diary 📓
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-40 animate-pulse" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookHeart className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada pertanyaan diary</p>
          {user?.role === 'admin' && <p className="text-xs mt-2">Tambahkan pertanyaan untuk anggota UM</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((diary: any) => {
            const entries = (diary.entries as any[]) || [];
            const isToday = diary.date === today;
            const isExpanded = expandedId === diary.id;
            const alreadyAnswered = user ? entries.some((e: any) => e.username === user.username) : false;

            return (
              <div key={diary.id} className={`glass rounded-2xl overflow-hidden ${isToday ? 'border border-white/20' : ''}`}>
                {isToday && (
                  <div className="px-5 py-2 bg-white/5 text-xs text-primary font-semibold">📅 Pertanyaan Hari Ini</div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <p className="font-semibold leading-snug">💬 {diary.question}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(diary.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  {/* Answer form */}
                  {user && !alreadyAnswered && (
                    <div className="flex gap-2 mb-4">
                      <input
                        value={answerTexts[diary.id] || ''}
                        onChange={e => setAnswerTexts(prev => ({ ...prev, [diary.id]: e.target.value }))}
                        placeholder="Tulis jawabanmu..."
                        className="um-input flex-1 text-sm"
                        onKeyDown={e => e.key === 'Enter' && answerTexts[diary.id]?.trim() && submitAnswerMutation.mutate({ diaryId: diary.id, content: answerTexts[diary.id] })}
                      />
                      <button onClick={() => submitAnswerMutation.mutate({ diaryId: diary.id, content: answerTexts[diary.id] || '' })} disabled={!answerTexts[diary.id]?.trim()} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Entries preview */}
                  <button onClick={() => setExpandedId(isExpanded ? null : diary.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors w-full">
                    <span>{entries.length} jawaban</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </button>

                  {isExpanded && entries.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {entries.map((entry: any) => {
                        const reactions = (entry.reactions || {}) as Record<string, string[]>;
                        const myName = user?.username;
                        return (
                          <div key={entry.id} className="glass rounded-xl p-4">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {entry.username?.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-primary">@{entry.username}</p>
                                <p className="text-sm mt-0.5 leading-relaxed">{entry.content}</p>
                              </div>
                            </div>
                            {user && (
                              <div className="flex gap-1 flex-wrap ml-10">
                                {REACTION_EMOJIS.map(emoji => {
                                  const count = reactions[emoji]?.length || 0;
                                  const reacted = myName ? reactions[emoji]?.includes(myName) : false;
                                  return (
                                    <button key={emoji} onClick={() => reactMutation.mutate({ entryId: entry.id, emoji })} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all ${reacted ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
                                      {emoji}{count > 0 && <span>{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
