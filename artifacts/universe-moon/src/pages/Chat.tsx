import { useState, useRef, useEffect } from 'react';
import { useGetChatMessages, useSendChatMessage, useDeleteChatMessage } from '@workspace/api-client-react';
import { useAuthStore } from '@/hooks/use-auth';
import { formatTime } from '@/lib/utils';
import { Send, Smile, Trash2, Shield, MoreVertical } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';

export default function Chat() {
  const { data: messages = [], refetch } = useGetChatMessages(undefined, {
    query: { refetchInterval: 3000 } // Poll every 3s
  });
  const sendMutation = useSendChatMessage();
  const deleteMutation = useDeleteChatMessage();
  
  const { user, isGuest } = useAuthStore();
  const { playSfx } = useSound();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGuest || !user) return;
    
    const msg = input.trim();
    setInput('');
    playSfx('message');
    
    try {
      await sendMutation.mutateAsync({ data: { sender: user.username, content: msg } });
      refetch();
    } catch(e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Hapus pesan?")) return;
    await deleteMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] glass rounded-3xl overflow-hidden animate-in fade-in">
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-md">
        <div>
          <h2 className="font-serif font-bold text-lg">Universe Chat</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.map((msg, i) => {
          const isMe = msg.sender === user?.username;
          const showAvatar = i === 0 || messages[i-1].sender !== msg.sender;
          
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
              {!isMe && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-1">
                  {msg.sender.substring(0, 2).toUpperCase()}
                </div>
              )}
              {!isMe && !showAvatar && <div className="w-8 shrink-0" />}
              
              <div className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatar && !isMe && <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.sender}</span>}
                
                <div className={`relative px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' : 'glass rounded-2xl rounded-tl-sm'}`}>
                  {msg.content}
                  
                  {isAdmin && !isMe && (
                    <button onClick={() => handleDelete(msg.id)} className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 text-destructive p-1 bg-black/50 rounded-md">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 mx-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
        {isGuest ? (
          <div className="text-center text-sm text-muted-foreground py-2 italic">Guest tidak dapat mengirim pesan. Silahkan Register/Login.</div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <button type="button" className="p-3 glass rounded-xl text-muted-foreground hover:text-white transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <input 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              placeholder="Ketik pesan..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button type="submit" disabled={!input.trim()} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all disabled:opacity-50 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
