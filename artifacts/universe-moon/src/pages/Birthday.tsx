import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { useState } from 'react';
import { Calendar, Plus, Trash2, Cake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getDaysUntilBirthday(birthDate: string): number {
  const today = new Date();
  const [, month, day] = birthDate.split('-').map(Number);
  const next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isToday(birthDate: string): boolean {
  const today = new Date();
  const [, month, day] = birthDate.split('-').map(Number);
  return today.getMonth() + 1 === month && today.getDate() === day;
}

export default function Birthday() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [memberName, setMemberName] = useState('');

  const { data: birthdays = [] } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () => fetch('/api/birthdays').then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: () => fetch('/api/birthdays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user?.username, memberName: memberName || user?.username, birthDate }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['birthdays'] });
      setShowForm(false);
      toast({ title: '🎂 Birthday tersimpan!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (username: string) => fetch(`/api/birthdays/${username}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['birthdays'] }),
  });

  const sorted = [...birthdays].sort((a: any, b: any) => getDaysUntilBirthday(a.birthDate) - getDaysUntilBirthday(b.birthDate));
  const todayBirthdays = sorted.filter((b: any) => isToday(b.birthDate));
  const upcoming = sorted.filter((b: any) => !isToday(b.birthDate));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-glow">🎂 Birthday Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Ulang tahun anggota Universe Moon</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> Set Birthday
          </button>
        )}
      </div>

      {showForm && user && (
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4">Tambah/Edit Birthday Kamu</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nama</label>
              <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder={user.username} className="um-input w-full mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tanggal Lahir</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="um-input w-full mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={!birthDate} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors disabled:opacity-50">Simpan</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Today's birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4 text-yellow-400 flex items-center gap-2">
            🎉 Happy Birthday Hari Ini!
          </h2>
          <div className="space-y-3">
            {todayBirthdays.map((b: any) => (
              <div key={b.id} className="glass rounded-2xl p-5 border border-yellow-400/30 bg-yellow-400/5 relative overflow-hidden">
                <div className="absolute top-2 right-2 text-4xl opacity-30">🎂</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center text-2xl">🎂</div>
                  <div>
                    <p className="font-bold text-lg text-yellow-400">{b.memberName || b.username}</p>
                    <p className="text-sm text-muted-foreground">@{b.username} · Selamat ulang tahun! 🎉</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming birthdays */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Upcoming Birthdays
        </h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Cake className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada birthday yang terdaftar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b: any) => {
              const days = getDaysUntilBirthday(b.birthDate);
              const [, month, day] = b.birthDate.split('-').map(Number);
              const urgency = days <= 7 ? 'text-orange-400 border-orange-400/20' : days <= 30 ? 'text-blue-400 border-blue-400/10' : 'border-white/5';
              return (
                <div key={b.id} className={`glass rounded-2xl p-4 border flex items-center gap-4 ${urgency}`}>
                  <div className="text-center w-14 glass rounded-xl p-2 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">{months[month - 1]}</div>
                    <div className="text-2xl font-bold">{day}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{b.memberName || b.username}</p>
                    <p className="text-xs text-muted-foreground">@{b.username}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold">{days === 0 ? '🎉 Hari ini!' : `${days} hari`}</div>
                    <div className="text-xs text-muted-foreground">lagi</div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteMutation.mutate(b.username)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
