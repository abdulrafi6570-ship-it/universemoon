import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';
import {
  Heart, Users, Send, Trash2, SmilePlus, Crown, Baby, LogOut,
  Star, Zap, Bell, CheckCircle, XCircle, Home, Trophy, Plus, X
} from 'lucide-react';

const EMOJIS = ['❤️','😂','🔥','✨','😮','👍','🥺','😭','💀','🫂'];
const FAMILY_EMOJIS = ['👨‍👩‍👧‍👦','🏠','🌙','⭐','🌸','💜','🌊','🦋','🎭','🎪'];

type Tab = 'keluargaku' | 'semua' | 'lamaran';

function XpBar({ xp, level }: { xp: number; level: number }) {
  const needed = level * 100;
  const pct = Math.min((xp / needed) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {level}</span><span>{xp}/{needed} XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'mami') return <span className="px-2 py-0.5 rounded-full text-xs bg-pink-500/20 text-pink-400 border border-pink-500/30">👩 Mami</span>;
  if (role === 'papi') return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">👨 Papi</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">🧒 Anak</span>;
}

export default function Apipi() {
  const { user, isGuest } = useAuthStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('keluargaku');
  const [myFamily, setMyFamily] = useState<any>(null);
  const [allFamilies, setAllFamilies] = useState<any[]>([]);
  const [proposals, setProposals] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);

  // proposal form
  const [propTarget, setPropTarget] = useState('');
  const [propType, setPropType] = useState<'partner' | 'adopt'>('partner');
  const [propMsg, setPropMsg] = useState('');
  const [propSending, setPropSending] = useState(false);

  // family name modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingProposalId, setPendingProposalId] = useState<number | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyEmoji, setFamilyEmoji] = useState('👨‍👩‍👧‍👦');

  // wall
  const [wallInput, setWallInput] = useState('');
  const [wallPosting, setWallPosting] = useState(false);
  const [showReact, setShowReact] = useState<number | null>(null);

  const fetchMyFamily = useCallback(async () => {
    if (!user || isGuest) return;
    const res = await fetch(`/api/apipi/families/mine?username=${user.username}`);
    if (res.ok) { const d = await res.json(); setMyFamily(d); }
  }, [user, isGuest]);

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/apipi/families');
    if (res.ok) setAllFamilies(await res.json());
  }, []);

  const fetchProposals = useCallback(async () => {
    if (!user || isGuest) return;
    const res = await fetch(`/api/apipi/proposals?username=${user.username}`);
    if (res.ok) setProposals(await res.json());
  }, [user, isGuest]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyFamily(), fetchAll(), fetchProposals()]);
    setLoading(false);
  }, [fetchMyFamily, fetchAll, fetchProposals]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto refresh setiap 8 detik
  useEffect(() => {
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const sendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTarget.trim() || !user) return;
    if (propTarget.trim().toLowerCase() === user.username.toLowerCase())
      return toast({ title: 'Tidak bisa lamar diri sendiri 😅', variant: 'destructive' });
    setPropSending(true);
    try {
      const body: any = { fromUsername: user.username, toUsername: propTarget.trim(), type: propType, message: propMsg };
      if (propType === 'adopt' && myFamily) body.familyId = myFamily.family.id;
      const res = await fetch('/api/apipi/proposals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: propType === 'partner' ? '💌 Lamaran terkirim!' : '👶 Undangan adopsi terkirim!' });
        setPropTarget(''); setPropMsg(''); fetchProposals();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Gagal kirim', variant: 'destructive' });
      }
    } finally { setPropSending(false); }
  };

  const handleAccept = async (proposal: any) => {
    if (proposal.type === 'partner') {
      setPendingProposalId(proposal.id);
      setFamilyName(`Keluarga ${proposal.fromUsername} & ${user!.username}`);
      setShowNameModal(true);
    } else {
      await doAccept(proposal.id, '', '');
    }
  };

  const doAccept = async (propId: number, name: string, emoji: string) => {
    const res = await fetch(`/api/apipi/proposals/${propId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', familyName: name, familyEmoji: emoji }),
    });
    if (res.ok) {
      toast({ title: '🎉 Keluarga terbentuk!' });
      setShowNameModal(false); refresh();
    } else {
      toast({ title: 'Gagal', variant: 'destructive' });
    }
  };

  const handleReject = async (propId: number) => {
    await fetch(`/api/apipi/proposals/${propId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    toast({ title: 'Lamaran ditolak' }); fetchProposals();
  };

  const postWall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallInput.trim() || !myFamily || !user) return;
    setWallPosting(true);
    const res = await fetch(`/api/apipi/families/${myFamily.family.id}/wall`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, content: wallInput.trim() }),
    });
    if (res.ok) { setWallInput(''); fetchMyFamily(); }
    setWallPosting(false);
  };

  const reactWall = async (postId: number, emoji: string) => {
    if (!user || !myFamily) return;
    setShowReact(null);
    await fetch(`/api/apipi/families/${myFamily.family.id}/wall/${postId}/react`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, emoji }),
    });
    fetchMyFamily();
  };

  const deleteWallPost = async (postId: number) => {
    if (!myFamily) return;
    await fetch(`/api/apipi/families/${myFamily.family.id}/wall/${postId}`, { method: 'DELETE' });
    fetchMyFamily();
  };

  const leaveFamily = async () => {
    if (!myFamily || !user) return;
    if (!confirm('Yakin mau kabur dari keluarga? 💔')) return;
    if (myFamily.role === 'anak') {
      await fetch(`/api/apipi/families/${myFamily.family.id}/members/${user.username}`, { method: 'DELETE' });
      toast({ title: '😢 Kamu kabur dari keluarga...' }); refresh();
    } else {
      if (!confirm('Sebagai Mami/Papi, ini akan MEMBUBARKAN seluruh keluarga. Lanjut?')) return;
      await fetch(`/api/apipi/families/${myFamily.family.id}`, { method: 'DELETE' });
      toast({ title: '💔 Keluarga telah bubar...' }); refresh();
    }
  };

  const pendingCount = proposals.incoming.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2">
        <div className="text-5xl">👨‍👩‍👧‍👦</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          APIPI
        </h1>
        <p className="text-muted-foreground text-sm">Sistem Keluarga Komunitas · Mami, Papi & Anak</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 rounded-xl p-1">
        {([
          { key: 'keluargaku', label: 'Keluargaku', icon: Home },
          { key: 'semua', label: 'Semua', icon: Trophy },
          { key: 'lamaran', label: 'Lamaran', icon: Bell, badge: pendingCount },
        ] as const).map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all relative ${
              tab === key ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'text-muted-foreground hover:text-white'
            }`}>
            <Icon size={14} /> {label}
            {badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab: Keluargaku ── */}
      <AnimatePresence mode="wait">
        {tab === 'keluargaku' && (
          <motion.div key="keluargaku" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {myFamily ? (
              <>
                {/* Family Card */}
                <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{myFamily.family.emoji}</span>
                      <div>
                        <h2 className="font-bold text-lg">{myFamily.family.name}</h2>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={myFamily.role} />
                          <span className="text-xs text-muted-foreground">· {formatTime(myFamily.family.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={leaveFamily} title="Keluar" className="text-red-400 hover:text-red-300 transition-colors">
                      <LogOut size={16} />
                    </button>
                  </div>
                  <XpBar xp={myFamily.family.xp} level={myFamily.family.level} />
                  {/* Anggota */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">ANGGOTA KELUARGA</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { username: myFamily.family.mamiUsername, role: 'mami' },
                        { username: myFamily.family.papiUsername, role: 'papi' },
                        ...(myFamily.members || []).filter((m: any) => m.role === 'anak'),
                      ].map((m: any) => (
                        <div key={m.username} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
                          <span className="text-sm">{m.role === 'mami' ? '👩' : m.role === 'papi' ? '👨' : '🧒'}</span>
                          <span className="text-xs font-medium">{m.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adopsi anak baru (hanya mami/papi) */}
                  {(myFamily.role === 'mami' || myFamily.role === 'papi') && (
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Baby size={12} /> Adopsi anak baru</p>
                      <form onSubmit={(e) => { e.preventDefault(); if (!propTarget.trim()) return; setPropType('adopt'); sendProposal(e); }}
                        className="flex gap-2">
                        <input value={propTarget} onChange={e => setPropTarget(e.target.value)}
                          placeholder="username anak..." className="flex-1 glass rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:outline-none focus:border-purple-500/50" />
                        <button type="submit" disabled={propSending}
                          className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors">
                          <Baby size={14} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Family Wall */}
                <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Home size={16} className="text-purple-400" /> Family Wall</h3>

                  {/* Post form */}
                  {!isGuest && (
                    <form onSubmit={postWall} className="flex gap-2">
                      <input value={wallInput} onChange={e => setWallInput(e.target.value)}
                        placeholder="Tulis sesuatu untuk keluarga..."
                        className="flex-1 glass rounded-xl px-4 py-2 text-sm border border-white/10 focus:outline-none focus:border-purple-500/50" />
                      <button type="submit" disabled={wallPosting || !wallInput.trim()}
                        className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors disabled:opacity-50">
                        <Send size={14} />
                      </button>
                    </form>
                  )}

                  {/* Posts */}
                  {(myFamily.wall || []).length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">Belum ada post. Jadilah yang pertama! 🌸</p>
                  ) : (
                    <div className="space-y-3">
                      {(myFamily.wall || []).map((post: any) => {
                        const reactions = (post.reactions || {}) as Record<string, string[]>;
                        const isOwn = user?.username === post.username;
                        return (
                          <motion.div key={post.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 rounded-xl p-3 space-y-2 border border-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-xs font-bold border border-white/10">
                                  {post.username[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{post.username}</span>
                                <span className="text-xs text-muted-foreground">{formatTime(post.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setShowReact(showReact === post.id ? null : post.id)}
                                  className="text-muted-foreground hover:text-yellow-400 transition-colors p-1">
                                  <SmilePlus size={13} />
                                </button>
                                {(isOwn || user?.role === 'admin') && (
                                  <button onClick={() => deleteWallPost(post.id)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm">{post.content}</p>
                            {/* Reactions */}
                            {Object.keys(reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(reactions).map(([emoji, users]) => (
                                  <button key={emoji} onClick={() => reactWall(post.id, emoji)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                                      user && (users as string[]).includes(user.username)
                                        ? 'bg-purple-500/30 border-purple-500/50' : 'bg-white/5 border-white/10 hover:border-white/30'
                                    }`}>
                                    {emoji} <span>{(users as string[]).length}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {/* Emoji picker */}
                            <AnimatePresence>
                              {showReact === post.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex flex-wrap gap-1">
                                  {EMOJIS.map(e => (
                                    <button key={e} onClick={() => reactWall(post.id, e)}
                                      className="text-lg hover:scale-125 transition-transform">{e}</button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* No family yet */
              <div className="space-y-4">
                <div className="glass rounded-2xl p-6 border border-white/10 text-center space-y-3">
                  <div className="text-5xl">🌸</div>
                  <h2 className="font-bold text-lg">Kamu belum punya keluarga!</h2>
                  <p className="text-muted-foreground text-sm">Lamar seseorang jadi Mami/Papi-mu, atau tunggu lamaran masuk</p>
                </div>

                {!isGuest && (
                  <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Heart size={16} className="text-pink-400" /> Kirim Lamaran Partner
                    </h3>
                    <form onSubmit={(e) => { setPropType('partner'); sendProposal(e); }} className="space-y-3">
                      <input value={propTarget} onChange={e => setPropTarget(e.target.value)}
                        placeholder="Username yang mau dilamar..."
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-pink-500/50" />
                      <textarea value={propMsg} onChange={e => setPropMsg(e.target.value)}
                        placeholder="Pesan lamaran (opsional)... ✨"
                        rows={2} className="w-full glass rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-pink-500/50 resize-none" />
                      <button type="submit" disabled={propSending || !propTarget.trim()}
                        className="w-full py-2.5 bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-300 border border-pink-500/40 rounded-xl font-medium hover:from-pink-500/40 hover:to-purple-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <Heart size={14} /> {propSending ? 'Mengirim...' : 'Kirim Lamaran 💌'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Semua Keluarga ── */}
        {tab === 'semua' && (
          <motion.div key="semua" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy size={14} className="text-yellow-400" /> <span>{allFamilies.length} keluarga terdaftar</span>
            </div>
            {allFamilies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Belum ada keluarga yang terbentuk 🌸</div>
            ) : (
              allFamilies.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="text-3xl">{f.emoji}</span>
                      {i === 0 && <Crown size={14} className="absolute -top-1 -right-1 text-yellow-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{f.name}</h3>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">Lv.{f.level}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        👩 {f.mamiUsername} · 👨 {f.papiUsername} · 🧒 {Math.max(0, f.memberCount - 2)} anak
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-400">{f.xp} XP</div>
                      <div className="text-xs text-muted-foreground">#{i + 1}</div>
                    </div>
                  </div>
                  <XpBar xp={f.xp} level={f.level} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── Tab: Lamaran ── */}
        {tab === 'lamaran' && (
          <motion.div key="lamaran" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {isGuest ? (
              <p className="text-center text-muted-foreground py-8">Login dulu untuk lihat lamaran 🔒</p>
            ) : (
              <>
                {/* Incoming */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Bell size={14} className="text-pink-400" /> Lamaran Masuk
                    {proposals.incoming.length > 0 && (
                      <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">{proposals.incoming.length}</span>
                    )}
                  </h3>
                  {proposals.incoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 glass rounded-xl border border-white/10">
                      Belum ada lamaran masuk 🌸
                    </p>
                  ) : (
                    proposals.incoming.map((p) => (
                      <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-xl p-4 border border-pink-500/20 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center font-bold border border-white/10">
                            {p.fromUsername[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              <span className="text-pink-400">{p.fromUsername}</span>
                              {p.type === 'partner' ? ' ingin jadi Mami/Papi kamu! 💌' : ' ingin mengadopsimu sebagai anak! 👶'}
                            </p>
                            {p.message && <p className="text-xs text-muted-foreground italic">"{p.message}"</p>}
                            <p className="text-xs text-muted-foreground">{formatTime(p.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(p)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors">
                            <CheckCircle size={14} /> Terima
                          </button>
                          <button onClick={() => handleReject(p.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                            <XCircle size={14} /> Tolak
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Outgoing */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Send size={14} className="text-blue-400" /> Lamaran Terkirim
                  </h3>
                  {proposals.outgoing.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 glass rounded-xl border border-white/10">Belum ada lamaran yang dikirim</p>
                  ) : (
                    proposals.outgoing.map((p) => (
                      <div key={p.id} className="glass rounded-xl p-3 border border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                          {p.toUsername[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">Menunggu jawaban dari <span className="text-blue-400 font-medium">{p.toUsername}</span></p>
                          <p className="text-xs text-muted-foreground">{p.type === 'partner' ? '💌 Lamaran Partner' : '👶 Adopsi Anak'} · {formatTime(p.createdAt)}</p>
                        </div>
                        <div className="text-xs text-yellow-400 animate-pulse">Menunggu...</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Nama keluarga */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setShowNameModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-sm border border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Beri nama keluargamu! 🏠</h3>
                <button onClick={() => setShowNameModal(false)}><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                  placeholder="Nama keluarga..." className="w-full glass rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:outline-none focus:border-purple-500/50" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Pilih emoji keluarga:</p>
                  <div className="flex flex-wrap gap-2">
                    {FAMILY_EMOJIS.map(e => (
                      <button key={e} onClick={() => setFamilyEmoji(e)}
                        className={`text-2xl p-1.5 rounded-lg transition-all ${familyEmoji === e ? 'bg-purple-500/30 border border-purple-500/50 scale-110' : 'hover:scale-110'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => pendingProposalId && doAccept(pendingProposalId, familyName, familyEmoji)}
                disabled={!familyName.trim()}
                className="w-full py-3 bg-gradient-to-r from-pink-500/40 to-purple-500/40 text-white border border-purple-500/50 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Heart size={16} /> Terima & Bentuk Keluarga 🎉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
