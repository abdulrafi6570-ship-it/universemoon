import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Quote as QuoteIcon, Star, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuotePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  const { data: activeQuote } = useQuery({
    queryKey: ['quote-active'],
    queryFn: () => fetch('/api/quotes/active').then(r => r.json()),
    refetchInterval: 3600000,
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => fetch('/api/quotes').then(r => r.json()),
    enabled: user?.role === 'admin',
  });

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author, submittedBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      setContent(''); setAuthor(''); setShowForm(false);
      toast({ title: '✨ Quote ditambahkan!' });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/quotes/${id}/activate`, { method: 'PATCH' }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote-active'] });
      qc.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: '⭐ Quote diaktifkan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/quotes/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">✨ Quote of the Day</h1>
          <p className="text-muted-foreground text-sm mt-1">Inspirasi harian Universe Moon</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Submit Quote
          </button>
        )}
      </div>

      {/* Active Quote */}
      {activeQuote ? (
        <div className="glass rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-6xl opacity-10 font-serif">"</div>
          <div className="absolute bottom-4 right-6 text-6xl opacity-10 font-serif">"</div>
          <QuoteIcon className="w-8 h-8 mx-auto mb-6 text-yellow-400 opacity-60" />
          <p className="text-xl md:text-2xl font-serif leading-relaxed text-white/90 mb-6">
            "{activeQuote.content}"
          </p>
          {activeQuote.author && (
            <p className="text-muted-foreground text-sm font-medium">— {activeQuote.author}</p>
          )}
          {activeQuote.submittedBy && (
            <p className="text-xs text-muted-foreground/60 mt-2">disubmit oleh @{activeQuote.submittedBy}</p>
          )}
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 mb-8 text-center">
          <QuoteIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">Belum ada quote aktif hari ini</p>
          {user?.role === 'admin' && <p className="text-xs mt-2 text-muted-foreground">Aktifkan quote di bawah</p>}
        </div>
      )}

      {/* Submit Form */}
      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Submit Quote</h2>
          <div className="space-y-3">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tulis quote inspiratifmu..." className="um-input w-full h-24 resize-none" maxLength={400} />
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Sumber / Penulis (opsional)" className="um-input w-full" />
            <div className="flex gap-2">
              <button onClick={() => addMutation.mutate()} disabled={!content.trim()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Submit ✨</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: All quotes */}
      {user?.role === 'admin' && allQuotes.length > 0 && (
        <div>
          <h2 className="font-bold mb-4">Semua Quote (Admin)</h2>
          <div className="space-y-3">
            {(allQuotes as any[]).map((q: any) => (
              <div key={q.id} className={`glass rounded-xl p-4 group ${q.isActive ? 'border border-yellow-400/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">"{q.content}"</p>
                    {q.author && <p className="text-xs text-muted-foreground mt-1">— {q.author}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-1">@{q.submittedBy}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {q.isActive ? (
                      <span className="text-xs text-yellow-400 flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> Aktif</span>
                    ) : (
                      <button onClick={() => activateMutation.mutate(q.id)} className="p-2 glass hover:bg-white/10 rounded-lg text-muted-foreground hover:text-yellow-400 transition-colors" title="Aktifkan">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(q.id)} className="p-2 glass hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
