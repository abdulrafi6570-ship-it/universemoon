import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skull, Droplet } from 'lucide-react';

export default function DraculaGame() {
  const [phase, setPhase] = useState<'night' | 'day'>('night');

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8 animate-in fade-in">
      <div className={`glass p-10 rounded-3xl text-center border-t-4 transition-colors duration-1000 ${phase === 'night' ? 'border-red-900 bg-red-950/20' : 'border-gray-500 bg-gray-900/20'}`}>
        {phase === 'night' ? (
          <Droplet className="w-16 h-16 mx-auto text-red-600 mb-4 animate-bounce" />
        ) : (
          <Skull className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        )}
        <h1 className="text-4xl font-serif font-bold mb-2 uppercase tracking-widest text-red-500">
          {phase === 'night' ? 'Malam Tiba' : 'Pagi Hari'}
        </h1>
        <p className="text-muted-foreground">
          {phase === 'night' ? 'Dracula mencari mangsa...' : 'Siapa yang kehabisan darah semalam?'}
        </p>
        
        <button 
          onClick={() => setPhase(p => p === 'night' ? 'day' : 'night')}
          className="mt-8 bg-red-900/30 text-red-200 px-6 py-2 rounded-full hover:bg-red-800/50 transition-colors border border-red-900/50"
        >
          Ganti Waktu
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Dracula 🧛', 'Minion 🦇', 'Investigator 🔍', 'Exorcist ✝️'].map(role => (
          <div key={role} className="glass p-4 rounded-2xl text-center border border-red-900/20 hover:border-red-500/50 transition-colors">
            <div className="text-2xl mb-2">{role.split(' ')[1]}</div>
            <div className="font-bold text-sm text-red-100">{role.split(' ')[0]}</div>
          </div>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground p-8 glass rounded-3xl">
        Dracula di Desa (Versi Visual).<br/>Role: Villager, Medium, Monk, Fortuneteller menanti di update berikutnya.
      </div>
    </div>
  );
}
