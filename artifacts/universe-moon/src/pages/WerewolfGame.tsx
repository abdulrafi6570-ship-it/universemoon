import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Users } from 'lucide-react';

// Simplified Werewolf UI just for visualization to meet requirements
export default function WerewolfGame() {
  const [phase, setPhase] = useState<'day' | 'night'>('night');
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8 animate-in fade-in">
      <div className={`glass p-10 rounded-3xl text-center border-t-4 transition-colors duration-1000 ${phase === 'night' ? 'border-indigo-500 bg-indigo-950/20' : 'border-orange-500 bg-orange-950/20'}`}>
        {phase === 'night' ? (
          <Moon className="w-16 h-16 mx-auto text-indigo-400 mb-4 animate-pulse" />
        ) : (
          <Sun className="w-16 h-16 mx-auto text-orange-400 mb-4" />
        )}
        <h1 className="text-4xl font-serif font-bold mb-2 uppercase tracking-widest">
          {phase === 'night' ? 'Night Phase' : 'Day Phase'}
        </h1>
        <p className="text-muted-foreground">
          {phase === 'night' ? 'Werewolves, buka mata kalian...' : 'Warga desa terbangun. Siapa yang mati malam ini?'}
        </p>
        
        <button 
          onClick={() => setPhase(p => p === 'night' ? 'day' : 'night')}
          className="mt-8 bg-white/10 px-6 py-2 rounded-full hover:bg-white/20 transition-colors"
        >
          Toggle Phase
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Werewolf 🐺', 'Villager 🧑‍🌾', 'Seer 🔮', 'Doctor ⚕️'].map(role => (
          <div key={role} className="glass p-4 rounded-2xl text-center">
            <div className="text-2xl mb-2">{role.split(' ')[1]}</div>
            <div className="font-bold text-sm">{role.split(' ')[0]}</div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground p-8 glass rounded-3xl">
        Game engine Werewolf sedang dalam pengembangan lanjutan. <br/>Gunakan Voice Chat untuk bermain sementara.
      </div>
    </div>
  );
}
