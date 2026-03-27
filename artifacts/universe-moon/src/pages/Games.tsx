import { Link } from 'wouter';
import { Gamepad2, Users, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Games() {
  const gamesList = [
    {
      id: 'imposter',
      title: 'Who is Imposter 🕵️',
      description: 'Cari tahu siapa penyusup di antara kita sebelum semua hancur.',
      players: '3-10',
      path: '/games/imposter',
      color: 'from-red-600/20 to-orange-600/20',
      border: 'border-red-500/20'
    },
    {
      id: 'werewolf',
      title: 'Werewolf 🐺',
      description: 'Bulan purnama tiba. Siapa yang menjadi serigala di desa ini?',
      players: '5-15',
      path: '/games/werewolf',
      color: 'from-blue-600/20 to-indigo-600/20',
      border: 'border-blue-500/20'
    },
    {
      id: 'dracula',
      title: 'Dracula di Desa 🧛',
      description: 'Malam yang gelap. Selamatkan desa dari gigitan dracula.',
      players: '5-12',
      path: '/games/dracula',
      color: 'from-purple-600/20 to-fuchsia-600/20',
      border: 'border-purple-500/20'
    },
    {
      id: 'ludo',
      title: 'Ludo Classic 🎲',
      description: 'Mainkan ludo santai bersama teman-teman semesta.',
      players: '2-4',
      path: '/games/ludo',
      color: 'from-green-600/20 to-emerald-600/20',
      border: 'border-green-500/20'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center mb-6 rotate-12 shadow-[0_0_40px_rgba(var(--primary),0.3)]">
          <Gamepad2 className="w-10 h-10 text-primary -rotate-12" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-3">Game Hub</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">Habiskan waktu bersama dengan bermain minigames eksklusif Universe Moon.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gamesList.map((game, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            key={game.id} 
            className={`glass p-8 rounded-3xl border ${game.border} bg-gradient-to-br ${game.color} relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24" />
            </div>
            
            <h2 className="text-2xl font-serif font-bold mb-2 relative z-10">{game.title}</h2>
            <p className="text-sm text-white/70 mb-6 relative z-10 min-h-[40px]">{game.description}</p>
            
            <div className="flex items-center justify-between mt-auto relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                <Users className="w-3.5 h-3.5" /> {game.players} Players
              </div>
              
              <Link href={game.path} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform flex items-center gap-2">
                <Crown className="w-4 h-4"/> Mulai Main
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
