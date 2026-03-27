import { useQuery } from '@tanstack/react-query';
import { UserMinus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExMembers() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['ex-members'],
    queryFn: async () => {
      const res = await fetch('/api/members');
      if (!res.ok) return [];
      const data = await res.json();
      return data.filter((m: any) => !m.isActive);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold mb-2 text-white/70">Ex-Members</h1>
        <p className="text-sm text-muted-foreground">Mereka yang pernah menghiasi semesta Universe Moon.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Mencari jejak...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <UserMinus className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Belum ada ex-member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member: any, i: number) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              key={member.id} 
              className="glass p-6 rounded-3xl grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 border border-red-500/20"
            >
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={member.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} 
                  alt={member.name} 
                  className="w-16 h-16 rounded-full bg-white/5 border border-white/10 object-cover" 
                />
                <div>
                  <h3 className="font-bold text-lg leading-tight line-through decoration-red-500">{member.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">"{member.nickname}"</p>
                  <span className="inline-block bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 uppercase font-bold tracking-wider">
                    Ex-Member
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-muted-foreground border-t border-white/10 pt-4">
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Join: {member.joinDate || '-'}</div>
                {member.kickDate && <div className="flex items-center gap-2 text-red-400/80"><Calendar className="w-3.5 h-3.5"/> Keluar: {member.kickDate}</div>}
              </div>

              {member.kickReason && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-300">
                  <span className="font-bold block mb-1">Alasan:</span>
                  {member.kickReason}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
