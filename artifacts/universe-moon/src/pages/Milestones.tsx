import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Plus, Trash2, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MILESTONE_ICONS = ['⭐', '🎉', '🚀', '💜', '🌙', '🔥', '👑', '🎂', '🏆', '💫', '🌟', '🎵', '📸', '✨', '🌺'];

export default function Milestones() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('⭐');

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => fetch('/api/milestones').then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, date, icon, addedBy: user?.username }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] });
      setTitle(''); setDescription(''); setDate(''); setIcon('⭐'); setShowForm(false);
      toast({ title: '🎉 Milestone ditambahkan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/milestones/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });

  const sorted = [...(milestones as any[])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const passed = sorted.filter(m => new Date(m.date) <= new Date());
  const upcoming = sorted.filter(m => new Date(m.date) > new Date());

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow flex items-center gap-2"><Flag className="w-7 h-7 text-yellow-400" /> Milestones Grup</h1>
          <p className="text-muted-foreground text-sm mt-1">Pencapaian & momen bersejarah Universe Moon</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tambah Milestone</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {MILESTONE_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)} className={`text-xl p-1.5 rounded-xl transition-all ${icon === ic ? 'bg-white/20 scale-110' : 'hover:bg-white/10'}`}>{ic}</button>
              ))}
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul milestone..." className="um-input w-full" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi (opsional)..." className="um-input w-full h-20 resize-none" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="um-input w-full" />
            <div className="flex gap-2">
              <button onClick={() => addMutation.mutate()} disabled={!title || !date} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Tambahkan</button>
              <button onClick={() => setShowForm(false)} className="px-4 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Flag className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p>Belum ada milestone</p>
        </div>
      ) : (
        <div>
          {passed.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-base mb-4 text-muted-foreground uppercase tracking-wider text-xs">Telah Tercapai</h2>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-4">
                  {passed.map((ms: any) => (
                    <div key={ms.id} className="flex gap-4 group">
                      <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 z-10 bg-white/5">
                        {ms.icon}
                      </div>
                      <div className="glass rounded-2xl p-4 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{ms.title}</h3>
                            {ms.description && <p className="text-sm text-muted-foreground mt-1">{ms.description}</p>}
                            <p className="text-xs text-muted-foreground mt-2">{new Date(ms.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          {user?.role === 'admin' && (
                            <button onClick={() => deleteMutation.mutate(ms.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="font-bold text-base mb-4 text-muted-foreground uppercase tracking-wider text-xs">Akan Datang</h2>
              <div className="space-y-3">
                {upcoming.map((ms: any) => {
                  const daysLeft = Math.ceil((new Date(ms.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={ms.id} className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/5 group">
                      <div className="text-2xl flex-shrink-0">{ms.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{ms.title}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(ms.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-primary">{daysLeft} hari</div>
                        <div className="text-xs text-muted-foreground">lagi</div>
                      </div>
                      {user?.role === 'admin' && (
                        <button onClick={() => deleteMutation.mutate(ms.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
