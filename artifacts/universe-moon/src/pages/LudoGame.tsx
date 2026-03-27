import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';

export default function LudoGame() {
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const { playSfx } = useSound();

  const rollDice = () => {
    if (rolling) return;
    playSfx('click');
    setRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        setRolling(false);
        playSfx('notification');
      }
    }, 100);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 animate-in zoom-in">
      <div className="glass p-8 rounded-3xl flex flex-col items-center">
        <h1 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
          <Dices className="text-green-500" /> Ludo Classic
        </h1>

        {/* Beautiful Abstract Ludo Board Representation */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 bg-black/50 border-8 border-white/10 rounded-2xl grid grid-cols-2 grid-rows-2 p-2 gap-2 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
          {/* Base Red */}
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl flex items-center justify-center relative">
            <div className="absolute inset-2 bg-red-500/20 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-2 z-10 p-4">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-red-500 shadow-lg"></div>)}
            </div>
          </div>
          {/* Base Green */}
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl flex items-center justify-center relative">
             <div className="absolute inset-2 bg-green-500/20 rounded-lg"></div>
             <div className="grid grid-cols-2 gap-2 z-10 p-4">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-green-500 shadow-lg"></div>)}
            </div>
          </div>
          {/* Base Blue */}
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl flex items-center justify-center relative">
             <div className="absolute inset-2 bg-blue-500/20 rounded-lg"></div>
             <div className="grid grid-cols-2 gap-2 z-10 p-4">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-blue-500 shadow-lg"></div>)}
            </div>
          </div>
          {/* Base Yellow */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex items-center justify-center relative">
             <div className="absolute inset-2 bg-yellow-500/20 rounded-lg"></div>
             <div className="grid grid-cols-2 gap-2 z-10 p-4">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-yellow-500 shadow-lg"></div>)}
            </div>
          </div>
          
          {/* Center Goal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-white border border-white/20 rounded-xl rotate-45 shadow-2xl flex items-center justify-center z-20">
            <div className="-rotate-45 font-bold text-black font-serif">UM</div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center">
          <motion.div 
            animate={rolling ? { rotate: [0, 90, 180, 270, 360] } : {}}
            transition={{ duration: 0.2, repeat: rolling ? Infinity : 0 }}
            className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6"
          >
            <span className="text-4xl font-bold text-black">{dice}</span>
          </motion.div>
          <button 
            onClick={rollDice}
            disabled={rolling}
            className="bg-white/10 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
          >
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        </div>
      </div>
    </div>
  );
}
