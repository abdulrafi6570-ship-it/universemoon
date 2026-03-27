import { useState } from 'react';
import { useGetMembers, useDeleteMember, useKickMember, useCreateMember } from '@workspace/api-client-react';
import { useAuthStore } from '@/hooks/use-auth';
import { UserMinus, Trash2, Plus, Star, Shield, Music, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

export default function Members() {
  const { data: members = [], refetch } = useGetMembers();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const { playSfx } = useSound();
  
  const [tab, setTab] = useState<'active' | 'ex'>('active');
  
  const activeMembers = members.filter(m => m.isActive);
  const exMembers = members.filter(m => !m.isActive);

  const deleteMutation = useDeleteMember();
  const kickMutation = useKickMember();

  const handleKick = async (id: number) => {
    if(!confirm("Yakin ingin kick member ini?")) return;
    try {
      await kickMutation.mutateAsync({ id, data: { reason: "Melanggar rules" }});
      playSfx('notification');
      toast({ title: "Member dikick" });
      refetch();
    } catch(e) {
      toast({ title: "Gagal kick", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Hapus permanen?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      playSfx('notification');
      toast({ title: "Dihapus" });
      refetch();
    } catch(e) {
      toast({ title: "Gagal hapus", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Bintang Semesta</h1>
          <p className="text-sm text-muted-foreground">Kenali para penghuni Universe Moon ✨</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass rounded-full p-1 flex">
            <button 
              onClick={() => setTab('active')} 
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${tab === 'active' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
            >
              Active ({activeMembers.length})
            </button>
            <button 
              onClick={() => setTab('ex')} 
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${tab === 'ex' ? 'bg-white text-black' : 'text-muted-foreground hover:text-white'}`}
            >
              Ex-Members ({exMembers.length})
            </button>
          </div>
          
          {isAdmin && (
            <Dialog>
              <DialogTrigger className="bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200">
                <Plus className="w-4 h-4"/> Tambah
              </DialogTrigger>
              <DialogContent className="glass border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Tambah Member Manual</DialogTitle>
                </DialogHeader>
                {/* Form placeholder for admin to force add members */}
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Gunakan Token Register untuk user daftar sendiri. Form ini untuk input manual oleh Admin.
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {(tab === 'active' ? activeMembers : exMembers).map(member => (
          <div key={member.id} className={`glass rounded-2xl p-5 relative group overflow-hidden ${!member.isActive ? 'grayscale opacity-70' : ''}`}>
            {isAdmin && member.isActive && (
              <button onClick={() => handleKick(member.id)} className="absolute top-4 right-4 bg-destructive/20 text-destructive p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white">
                <UserMinus className="w-4 h-4"/>
              </button>
            )}
            {isAdmin && !member.isActive && (
              <button onClick={() => handleDelete(member.id)} className="absolute top-4 right-4 bg-destructive/20 text-destructive p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white">
                <Trash2 className="w-4 h-4"/>
              </button>
            )}
            
            <div className="flex items-center gap-4 mb-4">
              <img src={member.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} alt={member.name} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 object-cover" />
              <div>
                <h3 className="font-bold text-lg leading-tight">{member.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">"{member.nickname}"</p>
                {member.role === 'admin' && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-sm"><Shield className="w-3 h-3"/> Admin</span>}
              </div>
            </div>
            
            {member.bio && <p className="text-sm text-gray-300 mb-4 line-clamp-2 italic">"{member.bio}"</p>}
            
            <div className="space-y-2 text-xs text-muted-foreground border-t border-white/5 pt-4">
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Join: {member.joinDate || 'Unknown'}</div>
              {member.favoriteSong && <div className="flex items-center gap-2"><Music className="w-3.5 h-3.5"/> {member.favoriteSong}</div>}
              {member.socialLinks && <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5"/> {member.socialLinks}</div>}
            </div>

            {!member.isActive && member.kickReason && (
              <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2 rounded-lg">
                <strong>Alasan Keluar:</strong> {member.kickReason}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(tab === 'active' ? activeMembers : exMembers).length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Belum ada {tab === 'active' ? 'member' : 'ex-member'} di sini.</p>
        </div>
      )}
    </div>
  );
}
