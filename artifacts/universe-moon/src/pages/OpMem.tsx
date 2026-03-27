import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { UsersRound, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OpMem() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opmemList = [], isLoading } = useQuery({
    queryKey: ['opmem'],
    queryFn: async () => {
      const res = await fetch('/api/opmem');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'OPEN' | 'CLOSED' }) => {
      const res = await fetch(`/api/opmem/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opmem'] })
  });

  const opmem = opmemList[0]; // Assuming one active opmem campaign at a time

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">Mencari informasi OpMem...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
          <UsersRound className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-2">Open Member</h1>
        <p className="text-muted-foreground">Mari bergabung dengan semesta Universe Moon.</p>
      </div>

      {!opmem ? (
        <div className="glass p-10 text-center rounded-3xl border border-white/10">
          <p className="text-muted-foreground mb-4">Saat ini tidak ada informasi Open Member.</p>
          {isAdmin && (
            <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold">
              Buat OpMem Baru
            </button>
          )}
        </div>
      ) : (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-8 rounded-3xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-bl-3xl ${opmem.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            Status: {opmem.status}
          </div>

          <h2 className="text-2xl font-bold mb-4 pr-32">{opmem.title}</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">
            {opmem.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 text-xs text-muted-foreground mb-8 border-y border-white/10 py-4">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Buka: {opmem.startDate ? new Date(opmem.startDate).toLocaleDateString() : '-'}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Tutup: {opmem.endDate ? new Date(opmem.endDate).toLocaleDateString() : '-'}</div>
          </div>

          {opmem.status === 'OPEN' ? (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-primary mb-2">Ingin Bergabung?</h3>
              <p className="text-xs text-muted-foreground mb-4">Ambil token pendaftaran melalui WhatsApp admin.</p>
              <a 
                href="https://wa.me/6283177780963?text=Halo%20saya%20mau%20mengambil%20kode%20token%20untuk%20daftar%20Universe%20Moon.%20Role%20saya%20adalah%3A%20" 
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-500 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                <MessageCircle className="w-4 h-4"/> Ambil Token via WhatsApp
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <CheckCircle className="w-5 h-5 text-primary" /> Member yang Diterima
              </div>
              {opmem.acceptedMembers ? (
                <div className="flex flex-wrap gap-2">
                  {opmem.acceptedMembers.split(',').map((name: string, i: number) => (
                    <span key={i} className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-medium">
                      {name.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Belum ada pengumuman.</p>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button 
                onClick={() => toggleStatusMutation.mutate({ id: opmem.id, status: opmem.status === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/20"
              >
                Set {opmem.status === 'OPEN' ? 'CLOSED' : 'OPEN'}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
