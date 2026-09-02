import { useState } from 'react';
import { useLogin, useRegister, useValidateToken } from '@workspace/api-client-react';
import { useAuthStore } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicSky } from '@/components/Theme/DynamicSky';
import { Loader2, Moon, Star, ArrowRight, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'token'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const validateMutation = useValidateToken();
  const { setUser, setGuest } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { playSfx } = useSound();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('click');
    try {
      const res = await loginMutation.mutateAsync({ data: { username, password } });
      if (res.success && res.user) {
        setUser(res.user);
        playSfx('notification');
        setLocation('/');
      }
    } catch (err: any) {
      playSfx('error');
      const cleanMessage = err?.data?.error || "Username atau password salah";
      toast({ title: "Login Gagal", description: cleanMessage, variant: "destructive" });
    }
  };

  const handleToken = async (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('click');
    try {
      const res = await validateMutation.mutateAsync({ data: { token } });
      if (res.valid) {
        setMode('register');
      }
    } catch (err) {
      playSfx('error');
      toast({ title: "Invalid Token", description: "Token ini tidak dikenali oleh semesta.", variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('click');
    try {
      await registerMutation.mutateAsync({ data: { username, password, token } });
      toast({ title: "Welcome to Universe Moon!", description: "Silahkan login dengan akun barumu." });
      setMode('login');
      setPassword('');
    } catch (err: any) {
      playSfx('error');
      const cleanMessage = err?.data?.error || "Username mungkin sudah ada.";
      toast({ title: "Pendaftaran Gagal", description: cleanMessage, variant: "destructive" });
    }
  };

  const handleGuest = () => {
    playSfx('click');
    setGuest(true);
    setLocation('/');
  };

  const isPending = loginMutation.isPending || validateMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <DynamicSky />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md glass rounded-3xl p-8 relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center font-serif font-bold text-2xl text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            UM
          </div>
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-center mb-2 text-glow">Universe Moon</h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">Tempat kenangan, cerita, dan ikatan yang tak pernah pudar.</p>

        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Username</label>
                <input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Siapa namamu?" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Password</label>
                <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
              </div>
              <button disabled={isPending} className="w-full bg-white text-black font-semibold rounded-xl py-3 mt-2 hover:bg-gray-200 transition-colors flex justify-center items-center gap-2">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk ke Semesta"}
              </button>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10 text-sm">
                <button type="button" onClick={() => setMode('token')} className="text-muted-foreground hover:text-white">Daftar Akun</button>
                <button type="button" onClick={handleGuest} className="text-primary hover:text-primary-foreground flex items-center gap-1">Guest Mode <ArrowRight className="w-4 h-4"/></button>
              </div>
            </motion.form>
          )}

          {mode === 'token' && (
            <motion.form key="token" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleToken} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Token Akses</label>
                <input required value={token} onChange={e => setToken(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono tracking-wider" placeholder="Masukkan token..." />
                <a href="https://wa.me/6283177780963?text=Halo%20saya%20mau%20mengambil%20kode%20token" target="_blank" rel="noreferrer" className="text-[10px] text-primary mt-2 flex items-center gap-1 hover:underline">
                  <HelpCircle className="w-3 h-3"/> Dapatkan token via WhatsApp
                </a>
              </div>
              <button disabled={isPending} className="w-full bg-primary text-white font-semibold rounded-xl py-3 hover:bg-primary/80 transition-colors flex justify-center items-center">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Validasi Token"}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-muted-foreground hover:text-white mt-4">Kembali ke Login</button>
            </motion.form>
          )}

          {mode === 'register' && (
            <motion.form key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRegister} className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <Star className="w-4 h-4"/> Token valid! Silahkan buat akun.
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Username</label>
                <input required autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Password</label>
                <input required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              <button disabled={isPending} className="w-full bg-white text-black font-semibold rounded-xl py-3 mt-2 hover:bg-gray-200 transition-colors flex justify-center items-center">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buat Akun"}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-sm text-muted-foreground hover:text-white mt-4">Batal</button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
