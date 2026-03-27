import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Send, MessageCircleQuestion, Check, X, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QA() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [targetMember, setTargetMember] = useState('');
  const [question, setQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [myInboxOpen, setMyInboxOpen] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(r => r.json()),
  });

  const { data: publicQA = [] } = useQuery({
    queryKey: ['qa-public'],
    queryFn: () => fetch('/api/qa').then(r => r.json()),
  });

  const { data: inbox = [] } = useQuery({
    queryKey: ['qa-inbox', user?.username],
    queryFn: () => user ? fetch(`/api/qa/${user.username}/inbox`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!user,
  });

  const sendMutation = useMutation({
    mutationFn: () => fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMember, question }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa-public'] });
      setQuestion(''); setTargetMember('');
      toast({ title: '✉️ Pertanyaan terkirim anonim!' });
    },
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer, isPublic }: { id: number; answer: string; isPublic: boolean }) =>
      fetch(`/api/qa/${id}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, isPublic }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa-public'] });
      qc.invalidateQueries({ queryKey: ['qa-inbox', user?.username] });
      setAnsweringId(null); setAnswerText('');
      toast({ title: '✅ Jawaban tersimpan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/qa/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qa-inbox', user?.username] }),
  });

  const activeMembers = (members as any[]).filter((m: any) => m.isActive);
  const myInbox = (inbox as any[]).filter((q: any) => !q.isAnswered);
  const answeredPublic = (publicQA as any[]).filter((q: any) => q.isPublic && q.isAnswered);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2">
          <MessageCircleQuestion className="w-7 h-7" /> Q&A Anonim
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Kirim pertanyaan anonim ke member UM</p>
      </div>

      {/* Send Question Form */}
      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4">Kirim Pertanyaan</h2>
        <div className="space-y-3">
          <select value={targetMember} onChange={e => setTargetMember(e.target.value)} className="um-input w-full">
            <option value="">Pilih member yang ingin ditanya...</option>
            {activeMembers.map((m: any) => (
              <option key={m.id} value={m.name}>{m.nickname || m.name}</option>
            ))}
          </select>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Tulis pertanyaanmu secara anonim..." className="um-input w-full h-20 resize-none" maxLength={300} />
          <button onClick={() => sendMutation.mutate()} disabled={!targetMember || !question.trim()} className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" /> Kirim Anonim 🎭
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Identitasmu tidak akan diketahui si penerima</p>
      </div>

      {/* My Inbox (for logged in users) */}
      {user && myInbox.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <button onClick={() => setMyInboxOpen(!myInboxOpen)} className="flex items-center justify-between w-full">
            <h2 className="font-bold flex items-center gap-2">
              📬 Pertanyaan Untukku
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{myInbox.length}</span>
            </h2>
            <ChevronDown className={`w-4 h-4 transition-transform ${myInboxOpen ? 'rotate-180' : ''}`} />
          </button>
          {myInboxOpen && (
            <div className="mt-4 space-y-3">
              {myInbox.map((q: any) => (
                <div key={q.id} className="glass rounded-xl p-4 border border-white/10">
                  <p className="text-sm mb-3">🎭 <span className="font-medium">Anonim:</span> {q.question}</p>
                  {answeringId === q.id ? (
                    <div className="space-y-2">
                      <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Tulis jawabanmu..." className="um-input w-full h-20 resize-none text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => answerMutation.mutate({ id: q.id, answer: answerText, isPublic: true })} disabled={!answerText.trim()} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                          <Check className="w-3 h-3" /> Jawab Publik
                        </button>
                        <button onClick={() => answerMutation.mutate({ id: q.id, answer: answerText, isPublic: false })} disabled={!answerText.trim()} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                          <Check className="w-3 h-3" /> Jawab Privat
                        </button>
                        <button onClick={() => { setAnsweringId(null); setAnswerText(''); }} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setAnsweringId(q.id)} className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors">Jawab</button>
                      <button onClick={() => deleteMutation.mutate(q.id)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-red-400">Hapus</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Public Q&A */}
      <div>
        <h2 className="font-bold mb-4">Q&A Publik</h2>
        {answeredPublic.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircleQuestion className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada Q&A yang dibagikan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answeredPublic.map((q: any) => (
              <div key={q.id} className="glass rounded-2xl p-5">
                <div className="mb-3">
                  <span className="text-xs glass px-2 py-1 rounded-full text-muted-foreground">untuk @{q.targetMember}</span>
                  <p className="mt-2 text-sm font-medium">🎭 {q.question}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-primary mb-1">Jawaban @{q.targetMember}:</p>
                  <p className="text-sm">{q.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
