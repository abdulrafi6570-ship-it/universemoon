import { useState } from 'react';
import { useGetNglMessages, useSendNglMessage, useDeleteNglMessage } from '@workspace/api-client-react';
import { useAuthStore } from '@/hooks/use-auth';
import { Ghost, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function Ngl() {
  const { data: messages = [], refetch } = useGetNglMessages();
  const sendMutation = useSendNglMessage();
  const deleteMutation = useDeleteNglMessage();
  
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await sendMutation.mutateAsync({ data: { content, recipient: recipient || undefined }});
      setContent('');
      setRecipient('');
      toast({ title: "Pesan terkirim anonim! 👻" });
      refetch();
    } catch(e) {
      toast({ title: "Gagal mengirim", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-4">
          <Ghost className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Anonymous Board</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Kirim pesan rahasia, confess, atau unek-unuhnya. Tidak ada yang tahu siapa kamu.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Kepada (Opsional)</label>
            <input value={recipient} onChange={e=>setRecipient(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Untuk semua..." />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Pesan Rahasia</label>
            <textarea required value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-none" placeholder="Tulis apa yang ada di hatimu... 🌙" />
          </div>
          <button disabled={sendMutation.isPending} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2">
            <Send className="w-4 h-4"/> Kirim Anonim
          </button>
        </form>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Bisikan dari Semesta</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={msg.id} className="glass p-5 rounded-2xl relative group">
            <p className="text-lg font-serif italic leading-relaxed text-white mb-3">"{msg.content}"</p>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>{msg.recipient ? `To: ${msg.recipient}` : 'To: All'}</span>
              <span>{formatTime(msg.createdAt)}</span>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => deleteMutation.mutateAsync({ id: msg.id }).then(()=>refetch())} className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4"/>
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
