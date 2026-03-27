import { Router } from "express";
import { db } from "@workspace/db";
import { gameRoomsTable, gameStatesTable, gameLeaderboardTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// ── 15 Kategori × 50 Kata ──────────────────────────────────────────────────
const CATEGORIES: Record<string, { name: string; role: string; emoji: string; words: string[] }> = {
  buah: {
    name: "Buah-Buahan",
    role: "Badut Buah 🍓",
    emoji: "🍉",
    words: ["Apel","Mangga","Pisang","Jeruk","Anggur","Semangka","Stroberi","Nanas","Pepaya","Jambu","Leci","Nangka","Durian","Rambutan","Belimbing","Alpukat","Kiwi","Delima","Ceri","Persik","Pir","Kelapa","Lemon","Melon","Sirsak","Salak","Manggis","Langsat","Sukun","Longan","Tin","Kurma","Aprikot","Nektarin","Jeruk Mandarin","Jeruk Bali","Kumquat","Kesemek","Loquat","Murbei","Stroberi Liar","Bluberi","Raspberi","Boysen","Markisa","Jambu Biji","Jambu Air","Duku","Matoa","Sawo"],
  },
  hewan: {
    name: "Hewan Peliharaan",
    role: "Badut Hewan 🐾",
    emoji: "🐱",
    words: ["Kucing","Anjing","Kelinci","Hamster","Burung","Ikan","Kura-kura","Marmut","Iguana","Bunglon","Landak Mini","Chinchilla","Sugar Glider","Musang","Rubah Kecil","Burung Beo","Kenari","Lovebird","Merpati","Ayam Kate","Bebek Mini","Angsa Mini","Koi","Arwana","Oscar","Louhan","Guppy","Molly","Platy","Swordtail","Discus","Tetra","Barb","Corydoras","Pleco","Betta","Axolotl","Salamander","Tokek","Ular Corn","Ular Ball Python","Biawak Kecil","Kelelawar Buah","Landak","Tupai","Musang Pandan","Kucing Hutan","Trenggiling Kecil","Opossum","Kinkajou"],
  },
  makanan: {
    name: "Makanan Indonesia",
    role: "Badut Chef 🍜",
    emoji: "🍛",
    words: ["Nasi Goreng","Mie Goreng","Rendang","Soto","Bakso","Sate","Gado-gado","Pecel","Rawon","Opor Ayam","Gulai","Pempek","Siomay","Batagor","Martabak","Klepon","Onde-onde","Dadar Gulung","Pisang Goreng","Tempe Goreng","Tahu Goreng","Kerupuk","Sambal","Nasi Kuning","Nasi Uduk","Bubur Ayam","Sop Buntut","Ikan Bakar","Ayam Geprek","Ayam Penyet","Pepes Ikan","Nasi Padang","Mie Aceh","Nasi Liwet","Rujak","Ketoprak","Laksa","Coto Makassar","Pallu Basa","Konro","Ikan Rica-rica","Mie Kocok","Mie Kari","Lontong Sayur","Ketupat","Nasi Jagung","Tiwul","Papeda","Kollo","Binte"],
  },
  warna: {
    name: "Warna-Warni",
    role: "Badut Warna 🎨",
    emoji: "🌈",
    words: ["Merah","Biru","Hijau","Kuning","Oranye","Ungu","Pink","Cokelat","Hitam","Putih","Abu-abu","Emas","Perak","Cyan","Magenta","Violet","Indigo","Toska","Maroon","Navy","Olive","Teal","Lime","Coral","Salmon","Krem","Gading","Tan","Khaki","Crimson","Scarlet","Vermillion","Amber","Oker","Jade","Emerald","Safir","Cobalt","Azure","Lavender","Mauve","Lilac","Fuchsia","Rose Gold","Burgundy","Plum","Chestnut","Sienna","Umber","Terracotta"],
  },
  profesi: {
    name: "Profesi & Pekerjaan",
    role: "Badut Karir 💼",
    emoji: "👨‍⚕️",
    words: ["Guru","Dokter","Perawat","Insinyur","Seniman","Musisi","Chef","Sopir","Pilot","Tentara","Polisi","Pemadam","Pengacara","Hakim","Akuntan","Petani","Nelayan","Tukang Kayu","Tukang Ledeng","Teknisi","Mekanik","Dokter Gigi","Apoteker","Dokter Hewan","Arsitek","Desainer","Programmer","Wartawan","Aktor","Penyanyi","Penari","Atlet","Pelatih","Pustakawan","Ilmuwan","Peneliti","Profesor","Kepala Sekolah","Direktur","Manajer","Pebisnis","Pedagang","Penjahit","Tukang Cukur","Salon","Kebersihan","Satpam","Resepsionis","Pramusaji","Kasir"],
  },
  olahraga: {
    name: "Cabang Olahraga",
    role: "Badut Sport 🏅",
    emoji: "⚽",
    words: ["Sepak Bola","Basket","Voli","Badminton","Tenis","Renang","Lari","Bersepeda","Tinju","Gulat","Judo","Karate","Taekwondo","Panahan","Golf","Kriket","Baseball","Softball","Hoki","Rugby","Handball","Tenis Meja","Squash","Anggar","Senam","Angkat Besi","Dayung","Berlayar","Surfing","Ski","Snowboard","Skateboard","Panjat Tebing","Selam","Polo","Biliar","Bowling","Dart","Catur","Atletik","Triatlon","Maraton","Sprint","Estafet","Lari Gawang","Lompat Tinggi","Lompat Jauh","Tolak Peluru","Lempar Cakram","Lempar Lembing"],
  },
  kendaraan: {
    name: "Kendaraan",
    role: "Badut Mobil 🚗",
    emoji: "🚌",
    words: ["Mobil","Bus","Truk","Motor","Sepeda","Kereta","Pesawat","Helikopter","Kapal","Kapal Selam","Roket","Trem","Monorail","Taksi","Ambulans","Pemadam","Mobil Polisi","Jeep","Van","Pick Up","Sedan","SUV","Convertible","Minibus","Skuter","Becak","Delman","Bajaj","Ojek","GoCar","Grab","Speedboat","Ferry","Kapal Pesiar","Kargo","Tanker","Tugboat","Kano","Kayak","Perahu Dayung","Perahu Layar","Yacht","Jet Ski","Gondola","Balon Udara","Glider","Drone","Hovercraft","Kapal Feri","Kereta Cepat"],
  },
  rumah: {
    name: "Benda di Rumah",
    role: "Badut Rumahan 🏠",
    emoji: "🛋️",
    words: ["Kursi","Meja","Sofa","Tempat Tidur","Bantal","Selimut","Lampu","Kipas","Televisi","Kulkas","Mesin Cuci","Microwave","Oven","Kompor","Wastafel","Toilet","Bathtub","Shower","Cermin","Jam Dinding","Vas Bunga","Bingkai Foto","Rak Buku","Lemari","Laci","Kabinet","Gorden","Karpet","Keset","Jendela","Pintu","Tangga","Balkon","Garasi","Taman","Loteng","Teras","Pagar","Atap","Lantai","Keramik","Kusen","Gagang Pintu","Saklar","Stop Kontak","Kipas Plafon","AC","Dispenser","Rak Piring","Tempat Sampah"],
  },
  teknologi: {
    name: "Teknologi & Gadget",
    role: "Badut Teknologi 💻",
    emoji: "📱",
    words: ["Handphone","Laptop","Komputer","Tablet","Keyboard","Mouse","Monitor","Printer","Scanner","Kamera","Headphone","Speaker","Televisi","Radio","Kalkulator","Charger","Kabel","USB","WiFi","Bluetooth","Internet","Email","Aplikasi","Software","Hardware","Prosesor","Memori","SSD","Baterai","Layar","Touchscreen","Sidik Jari","Face ID","GPS","Satelit","Drone","Robot","AI","VR","AR","Cloud","Server","Jaringan","Firewall","Antivirus","Browser","Mesin Pencari","Media Sosial","Smartwatch","Power Bank"],
  },
  alam: {
    name: "Alam & Lingkungan",
    role: "Badut Alam 🌿",
    emoji: "🏔️",
    words: ["Gunung","Bukit","Lembah","Sungai","Danau","Samudra","Laut","Pantai","Pulau","Gurun","Hutan","Hutan Hujan","Sabana","Tundra","Gletser","Gunung Berapi","Gua","Tebing","Air Terjun","Mata Air","Teluk","Selat","Semenanjung","Tanjung","Terumbu Karang","Mangrove","Padang Rumput","Rawa","Delta","Ngarai","Dataran Tinggi","Dataran Rendah","Ladang","Kebun","Taman Nasional","Suaka Margasatwa","Hutan Lindung","Ekosistem","Biosfer","Atmosfer","Awan","Petir","Angin","Tsunami","Gempa","Letusan","Banjir","Kekeringan","Tornado","Badai"],
  },
  emosi: {
    name: "Perasaan & Emosi",
    role: "Badut Perasaan 🎭",
    emoji: "😄",
    words: ["Bahagia","Sedih","Marah","Takut","Terkejut","Jijik","Cinta","Benci","Cemburu","Bangga","Malu","Bingung","Bosan","Semangat","Nervous","Cemas","Tenang","Damai","Puas","Syukur","Harap","Putus Asa","Kesepian","Rindu","Nostalgia","Melankolis","Euforia","Ekstatik","Frustrasi","Marah Sekali","Ketakutan","Terkejut Banget","Jijik Sekali","Iri","Malu Sekali","Rendah Hati","Percaya Diri","Insecure","Khawatir","Stres","Lega","Kecewa","Bersalah","Tak Bersalah","Putus Asa","Bertekad","Termotivasi","Terinspirasi","Gembira","Larut"],
  },
  musik: {
    name: "Alat Musik",
    role: "Badut Musik 🎸",
    emoji: "🎵",
    words: ["Gitar","Piano","Drum","Biola","Suling","Terompet","Saksofon","Bass","Keyboard","Ukulele","Harpa","Cello","Klarinet","Trombon","Tuba","Akordeon","Harmonika","Banjo","Mandolin","Sitar","Erhu","Koto","Gamelan","Angklung","Cajon","Djembe","Bongo","Tamborin","Marakas","Xilofon","Marimba","Vibraphone","Synthesizer","Turntable","Mikrofon","Amplifier","Equalizer","Mixer","Rekorder","Seruling Bambu","Kolintang","Rebab","Kecapi","Sapeh","Sasando","Tifa","Kendang","Gendang","Gong","Bonang"],
  },
  wisata: {
    name: "Tempat Wisata Indonesia",
    role: "Badut Wisata ✈️",
    emoji: "🗺️",
    words: ["Bali","Jakarta","Yogyakarta","Borobudur","Prambanan","Komodo","Raja Ampat","Lombok","Bromo","Semeru","Rinjani","Krakatau","Banda Neira","Wakatobi","Belitung","Labuan Bajo","Danau Toba","Bunaken","Derawan","Karimunjawa","Pangandaran","Tangkuban Perahu","Kawah Putih","Dieng","Malioboro","Kota Tua","Monas","Ancol","TMII","Puncak","Kebun Raya Bogor","Ranca Upas","Ciwidey","Lembang","Dago","Cihampelas","Nias","Sabang","Weh Island","Ijen","Baluran","Alas Purwo","Meru Betiri","Teluk Hijau","Nusa Penida","Gili Trawangan","Gili Air","Senggigi","Kuta Lombok","Mandalika"],
  },
  pakaian: {
    name: "Pakaian & Fashion",
    role: "Badut Fashion 👗",
    emoji: "👕",
    words: ["Kaos","Celana","Dress","Rok","Celana Pendek","Jaket","Jas Hujan","Sweater","Hoodie","Vest","Setelan","Dasi","Syal","Topi","Kerudung","Hijab","Sarung","Baju Koko","Batik","Kebaya","Baju Adat","Uniform","Jersey","Baju Renang","Baju Tidur","Kaos Kaki","Sepatu","Sandal","Sneakers","Boots","Heels","Selop","Ikat Pinggang","Tas","Ransel","Dompet","Jam Tangan","Cincin","Kalung","Gelang","Anting","Kacamata","Sunglasses","Masker","Gloves","Topi Baseball","Beanie","Beret","Fascinator","Bandana"],
  },
  sekolah: {
    name: "Benda di Sekolah",
    role: "Badut Sekolah 📚",
    emoji: "✏️",
    words: ["Papan Tulis","Kapur","Spidol","Penghapus","Buku","Buku Tulis","Pensil","Pulpen","Penggaris","Kalkulator","Kamus","Atlas","Globe","Peta","Mikroskop","Teleskop","Tabung Reaksi","Bunsen","PR","Ujian","Nilai","Rapor","Perpustakaan","Kantin","Lapangan","Laboratorium","Ruang Komputer","Ruang Seni","Ruang Musik","Aula","Kamar Mandi","Kantor","Koridor","Loker","Kursi","Meja","Bangku","Proyektor","Papan Informasi","Absen","Jadwal","Upacara","Ekstra","OSIS","PMR","Pramuka","KIR","UKS","BK","Koperasi"],
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORIES);

// ── Room code generator ──────────────────────────────────────────────────────
function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ── Imposter assignment ──────────────────────────────────────────────────────
function buildImposterPlayers(players: string[], categoryKey: string) {
  const cat = CATEGORIES[categoryKey];
  const shuffled = [...cat.words].sort(() => Math.random() - 0.5);
  const mainWord = shuffled[0];
  const imposterWord = shuffled[1];

  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const imposterCount = players.length >= 8 ? 2 : 1;
  const imposters = new Set(shuffledPlayers.slice(0, imposterCount));

  return {
    players: shuffledPlayers.map(username => ({
      username,
      isImposter: imposters.has(username),
      word: imposters.has(username) ? imposterWord : mainWord,
      role: imposters.has(username) ? "Imposter 🎭" : cat.role,
      hasGivenClue: false,
      clueRound2: false,
      votes: 0,
      eliminated: false,
    })),
    mainWord,
    imposterWord,
    category: cat.name,
  };
}

// ── Werewolf role assignment ──────────────────────────────────────────────────
function buildWerewolfPlayers(players: string[]) {
  const count = players.length;
  const wolfCount = count <= 5 ? 1 : count <= 8 ? 2 : 3;
  const specialGoodRoles = ["Dokter", "Peramal", "Pemburu", "Penyihir", "Pengawal"].slice(0, Math.min(count - wolfCount - 1, 5));
  
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return shuffled.map((username, i) => {
    let role: string, team: string;
    if (i < wolfCount) {
      role = i === 0 ? "Werewolf Alpha 🐺" : "Werewolf 🐺";
      team = "werewolf";
    } else if (i - wolfCount < specialGoodRoles.length) {
      role = specialGoodRoles[i - wolfCount] + " 🌟";
      team = "village";
    } else {
      role = "Warga 👤";
      team = "village";
    }
    return { username, role, team, isAlive: true, isRevealed: false, votes: 0, ability: null };
  });
}

// ── Dracula role assignment ──────────────────────────────────────────────────
function buildDraculaPlayers(players: string[]) {
  const count = players.length;
  const evilCount = count <= 5 ? 1 : count <= 8 ? 2 : 3;
  const goodRoles = ["Investigator 🔍", "Medium 🔮", "Biksu 🧘", "Peramal ✨", "Eksorsist ✝️", "Ahli Vampir 🧄", "Van Helsing ⚔️"].slice(0, Math.min(count - evilCount - 1, 7));
  
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return shuffled.map((username, i) => {
    let role: string, team: string;
    if (i === 0) {
      role = "Dracula 🧛";
      team = "evil";
    } else if (i < evilCount) {
      role = "Minion 🦇";
      team = "evil";
    } else if (i - evilCount < goodRoles.length) {
      role = goodRoles[i - evilCount];
      team = "good";
    } else {
      role = "Warga 👤";
      team = "good";
    }
    return { username, role, team, isAlive: true, isRevealed: false, votes: 0, ability: null, transformed: false };
  });
}

async function updateGameLeaderboard(username: string, gameType: string, won: boolean, xp: number) {
  const [existing] = await db.select().from(gameLeaderboardTable)
    .where(and(eq(gameLeaderboardTable.username, username), eq(gameLeaderboardTable.gameType, gameType)));
  
  if (existing) {
    await db.update(gameLeaderboardTable).set({
      wins: existing.wins! + (won ? 1 : 0),
      losses: existing.losses! + (won ? 0 : 1),
      gamesPlayed: existing.gamesPlayed! + 1,
      xpEarned: existing.xpEarned! + xp,
    }).where(eq(gameLeaderboardTable.id, existing.id));
  } else {
    await db.insert(gameLeaderboardTable).values({
      username, gameType,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      gamesPlayed: 1,
      xpEarned: xp,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

router.get("/categories", (req, res) => {
  const cats = Object.entries(CATEGORIES).map(([key, val]) => ({
    key, name: val.name, emoji: val.emoji, role: val.role,
  }));
  res.json(cats);
});

router.post("/room/create", async (req, res) => {
  const { gameType, hostUsername } = req.body;
  if (!gameType || !hostUsername) return res.status(400).json({ error: "Missing fields" });

  let code = genCode();
  let tries = 0;
  while (tries < 10) {
    const [existing] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, code));
    if (!existing) break;
    code = genCode();
    tries++;
  }

  const [room] = await db.insert(gameRoomsTable).values({
    code,
    gameType,
    hostUsername,
    status: "lobby",
    players: [{ username: hostUsername, ready: false }],
    phase: "lobby",
    round: 0,
    clueOrder: [],
    currentClueIdx: 0,
    clues: [],
    votes: [],
    settings: {},
  }).returning();

  res.json(room);
});

router.post("/room/join", async (req, res) => {
  const { code, username } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  if (room.status !== "lobby") return res.status(400).json({ error: "Game sudah dimulai" });

  const players = (room.players as any[]);
  if (players.find(p => p.username === username)) {
    return res.json(room);
  }
  if (players.length >= 15) return res.status(400).json({ error: "Room penuh (max 15)" });

  const newPlayers = [...players, { username, ready: false }];
  const [updated] = await db.update(gameRoomsTable).set({
    players: newPlayers,
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();

  res.json(updated);
});

router.get("/room/:code", async (req, res) => {
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  res.json(room);
});

router.post("/room/:code/start", async (req, res) => {
  const { username, categoryKey } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  if (room.hostUsername !== username) return res.status(403).json({ error: "Hanya host yang bisa mulai" });

  const players = (room.players as any[]).map(p => p.username);
  if (players.length < 2) return res.status(400).json({ error: "Minimal 2 pemain" });

  let updatedData: any = {};

  if (room.gameType === "imposter") {
    const catKey = categoryKey || CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)];
    const { players: assigned, mainWord, imposterWord, category } = buildImposterPlayers(players, catKey);
    const clueOrder = [...players].sort(() => Math.random() - 0.5);
    updatedData = {
      status: "playing",
      phase: "clue_round_1",
      players: assigned,
      category: catKey,
      clueOrder,
      currentClueIdx: 0,
      round: 1,
      clues: [],
      votes: [],
      settings: { mainWord, imposterWord, categoryName: category },
    };
  } else if (room.gameType === "werewolf") {
    const assigned = buildWerewolfPlayers(players);
    updatedData = {
      status: "playing",
      phase: "night",
      players: assigned,
      round: 1,
      clues: [],
      votes: [],
      settings: { nightAction: null, savedPlayer: null },
    };
  } else if (room.gameType === "dracula") {
    const assigned = buildDraculaPlayers(players);
    updatedData = {
      status: "playing",
      phase: "night",
      players: assigned,
      round: 1,
      clues: [],
      votes: [],
      settings: { nightAction: null, savedPlayer: null },
    };
  }

  const [updated] = await db.update(gameRoomsTable).set({ ...updatedData, updatedAt: new Date() })
    .where(eq(gameRoomsTable.id, room.id)).returning();
  res.json(updated);
});

// Submit a clue (Imposter game)
router.post("/room/:code/clue", async (req, res) => {
  const { username, clue } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });

  const players = room.players as any[];
  const clues = (room.clues as any[]) || [];
  const clueOrder = (room.clueOrder as string[]) || [];
  let currentIdx = room.currentClueIdx || 0;

  if (clueOrder[currentIdx] !== username) return res.status(403).json({ error: "Bukan giliranmu" });

  const newClues = [...clues, { username, clue, round: room.round }];
  let nextIdx = currentIdx + 1;
  let newPhase = room.phase;
  let newRound = room.round;

  if (nextIdx >= clueOrder.length) {
    if (room.round === 1) {
      newRound = 2;
      nextIdx = 0;
      newPhase = "clue_round_2";
    } else {
      newPhase = "voting";
      nextIdx = 0;
    }
  }

  const [updated] = await db.update(gameRoomsTable).set({
    clues: newClues,
    currentClueIdx: nextIdx,
    phase: newPhase,
    round: newRound,
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();

  res.json(updated);
});

// Submit a vote
router.post("/room/:code/vote", async (req, res) => {
  const { username, targetUsername } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  if (room.phase !== "voting") return res.status(400).json({ error: "Bukan fase voting" });

  const votes = (room.votes as any[]) || [];
  if (votes.find(v => v.from === username)) return res.status(400).json({ error: "Sudah voting" });

  const players = room.players as any[];
  const newVotes = [...votes, { from: username, target: targetUsername }];

  let newPlayers = [...players];
  let newPhase = room.phase;
  let winner = room.winner;

  // Check if all (alive) players voted
  const alivePlayers = players.filter(p => !p.eliminated);
  if (newVotes.length >= alivePlayers.length) {
    // Count votes
    const voteCounts: Record<string, number> = {};
    newVotes.forEach(v => { voteCounts[v.target] = (voteCounts[v.target] || 0) + 1; });
    const maxVotes = Math.max(...Object.values(voteCounts));
    const eliminated = Object.keys(voteCounts).filter(u => voteCounts[u] === maxVotes);
    const eliminatedUser = eliminated[0];

    newPlayers = players.map(p => p.username === eliminatedUser ? { ...p, eliminated: true, isRevealed: true } : p);

    const eliminatedPlayer = newPlayers.find(p => p.username === eliminatedUser);
    const imposters = newPlayers.filter(p => p.isImposter && !p.eliminated);
    const villagers = newPlayers.filter(p => !p.isImposter && !p.eliminated);

    if (eliminatedPlayer?.isImposter) {
      if (imposters.length === 0) {
        winner = "villagers";
        newPhase = "ended";
        // Update leaderboard
        for (const p of players) {
          await updateGameLeaderboard(p.username, "imposter", !p.isImposter, !p.isImposter ? 15 : 5);
        }
      } else {
        newPhase = "clue_round_1";
        newVotes.length = 0;
      }
    } else {
      // Wrong elimination - imposters continue
      if (imposters.length >= villagers.length) {
        winner = "imposters";
        newPhase = "ended";
        for (const p of players) {
          await updateGameLeaderboard(p.username, "imposter", p.isImposter, p.isImposter ? 15 : 5);
        }
      } else {
        newPhase = "clue_round_1";
        newVotes.length = 0;
      }
    }
  }

  const [updated] = await db.update(gameRoomsTable).set({
    votes: newVotes,
    players: newPlayers,
    phase: newPhase,
    winner: winner || null,
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();

  res.json(updated);
});

// Werewolf / Dracula night action
router.post("/room/:code/night-action", async (req, res) => {
  const { username, action, targetUsername } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });

  const players = room.players as any[];
  const actingPlayer = players.find(p => p.username === username);
  if (!actingPlayer) return res.status(403).json({ error: "Not in room" });

  const settings = (room.settings as any) || {};
  let newPlayers = [...players];
  let newPhase = room.phase;
  let newRound = room.round;
  let newSettings = { ...settings };
  let winner = null;

  if (action === "kill") {
    newSettings.nightKill = targetUsername;
  } else if (action === "save") {
    newSettings.savedPlayer = targetUsername;
  } else if (action === "investigate") {
    const target = players.find(p => p.username === targetUsername);
    return res.json({ team: target?.team || "unknown", role: target?.role || "Warga" });
  } else if (action === "day_vote") {
    const votes = (room.votes as any[]) || [];
    if (!votes.find(v => v.from === username)) {
      const newVotes = [...votes, { from: username, target: targetUsername }];
      const alivePlayers = players.filter(p => p.isAlive);
      
      if (newVotes.length >= alivePlayers.length) {
        const voteCounts: Record<string, number> = {};
        newVotes.forEach((v: any) => { voteCounts[v.target] = (voteCounts[v.target] || 0) + 1; });
        const maxVotes = Math.max(...Object.values(voteCounts));
        const eliminated = Object.keys(voteCounts).find(u => voteCounts[u] === maxVotes)!;
        
        newPlayers = players.map(p => p.username === eliminated ? { ...p, isAlive: false, isRevealed: true } : p);
        
        // Check win conditions
        const aliveWolves = newPlayers.filter(p => p.isAlive && (p.team === "werewolf" || p.team === "evil"));
        const aliveGood = newPlayers.filter(p => p.isAlive && (p.team === "village" || p.team === "good"));
        
        if (aliveWolves.length === 0) {
          winner = "good";
          newPhase = "ended";
          for (const p of players) {
            const won = p.team === "village" || p.team === "good";
            await updateGameLeaderboard(p.username, room.gameType, won, won ? 15 : 5);
          }
        } else if (aliveWolves.length >= aliveGood.length) {
          winner = "evil";
          newPhase = "ended";
          for (const p of players) {
            const won = p.team === "werewolf" || p.team === "evil";
            await updateGameLeaderboard(p.username, room.gameType, won, won ? 15 : 5);
          }
        } else {
          newPhase = "night";
          newRound = (room.round || 1) + 1;
          newSettings = { ...newSettings, nightKill: null, savedPlayer: null };
        }
        
        const [updated] = await db.update(gameRoomsTable).set({
          players: newPlayers, phase: newPhase, round: newRound,
          votes: [], settings: newSettings, winner, updatedAt: new Date(),
        }).where(eq(gameRoomsTable.id, room.id)).returning();
        return res.json(updated);
      }
      
      await db.update(gameRoomsTable).set({ votes: newVotes, updatedAt: new Date() }).where(eq(gameRoomsTable.id, room.id));
    }
    return res.json({ status: "vote_registered" });
  } else if (action === "end_night") {
    // Host ends night, apply kill
    const killed = newSettings.nightKill;
    const saved = newSettings.savedPlayer;
    
    if (killed && killed !== saved) {
      newPlayers = players.map(p => p.username === killed ? { ...p, isAlive: false, isRevealed: true } : p);
    }
    
    const aliveWolves = newPlayers.filter(p => p.isAlive && (p.team === "werewolf" || p.team === "evil"));
    const aliveGood = newPlayers.filter(p => p.isAlive && (p.team === "village" || p.team === "good"));
    
    if (aliveWolves.length === 0) {
      newPhase = "ended";
      winner = "good";
    } else if (aliveWolves.length >= aliveGood.length) {
      newPhase = "ended";
      winner = "evil";
    } else {
      newPhase = "day";
    }
    
    newSettings = { ...newSettings, nightKill: null, savedPlayer: null, lastKilled: killed !== saved ? killed : null };
  }

  const [updated] = await db.update(gameRoomsTable).set({
    players: newPlayers, phase: newPhase, round: newRound,
    settings: newSettings, winner, updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  
  res.json(updated);
});

// Reset / close room
router.post("/room/:code/reset", async (req, res) => {
  const { username } = req.body;
  const [room] = await db.select().from(gameRoomsTable).where(eq(gameRoomsTable.code, req.params.code.toUpperCase()));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  if (room.hostUsername !== username) return res.status(403).json({ error: "Hanya host" });

  const [updated] = await db.update(gameRoomsTable).set({
    status: "lobby",
    phase: "lobby",
    players: (room.players as any[]).map(p => ({ username: p.username, ready: false })),
    round: 0, clues: [], votes: [], winner: null,
    clueOrder: [], currentClueIdx: 0, category: null,
    settings: {}, updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  res.json(updated);
});

// ═══════════════════════════════════════════════════════════════════════════
// GAME LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════

router.get("/leaderboard/:gameType", async (req, res) => {
  const rows = await db.select().from(gameLeaderboardTable)
    .where(eq(gameLeaderboardTable.gameType, req.params.gameType))
    .orderBy(desc(gameLeaderboardTable.wins));
  res.json(rows);
});

router.get("/leaderboard-all", async (req, res) => {
  const rows = await db.select().from(gameLeaderboardTable).orderBy(desc(gameLeaderboardTable.xpEarned));
  res.json(rows);
});

// ═══════════════════════════════════════════════════════════════════════════
// LUDO GAME (per-device dice + position tracking)
// ═══════════════════════════════════════════════════════════════════════════

router.get("/ludo/:code", async (req, res) => {
  const [room] = await db.select().from(gameRoomsTable)
    .where(and(eq(gameRoomsTable.code, req.params.code.toUpperCase()), eq(gameRoomsTable.gameType, "ludo")));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  res.json(room);
});

router.post("/ludo/create", async (req, res) => {
  const { hostUsername } = req.body;
  let code = genCode();
  const colors = ["red", "blue", "green", "yellow"];
  
  const [room] = await db.insert(gameRoomsTable).values({
    code, gameType: "ludo", hostUsername,
    status: "lobby",
    players: [{ username: hostUsername, color: "red", tokens: [-1,-1,-1,-1], finished: false }],
    phase: "lobby", round: 0,
    settings: {
      currentPlayerIdx: 0,
      currentDice: null,
      diceRolled: false,
      winner: null,
      availableColors: colors,
    },
    clues: [], votes: [], clueOrder: [], currentClueIdx: 0,
  }).returning();
  res.json(room);
});

router.post("/ludo/:code/join", async (req, res) => {
  const { username, color } = req.body;
  const [room] = await db.select().from(gameRoomsTable)
    .where(and(eq(gameRoomsTable.code, req.params.code.toUpperCase()), eq(gameRoomsTable.gameType, "ludo")));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  
  const players = room.players as any[];
  if (players.find(p => p.username === username)) return res.json(room);
  if (players.length >= 4) return res.status(400).json({ error: "Ludo hanya untuk 4 pemain" });
  
  const usedColors = players.map((p: any) => p.color);
  const availableColors = ["red", "blue", "green", "yellow"].filter(c => !usedColors.includes(c));
  const chosenColor = color && availableColors.includes(color) ? color : availableColors[0];
  
  const [updated] = await db.update(gameRoomsTable).set({
    players: [...players, { username, color: chosenColor, tokens: [-1,-1,-1,-1], finished: false }],
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  res.json(updated);
});

router.post("/ludo/:code/start", async (req, res) => {
  const { username } = req.body;
  const [room] = await db.select().from(gameRoomsTable)
    .where(and(eq(gameRoomsTable.code, req.params.code.toUpperCase()), eq(gameRoomsTable.gameType, "ludo")));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  if (room.hostUsername !== username) return res.status(403).json({ error: "Hanya host" });
  
  const [updated] = await db.update(gameRoomsTable).set({
    status: "playing",
    phase: "playing",
    settings: { ...room.settings as any, currentPlayerIdx: 0, diceRolled: false, currentDice: null },
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  res.json(updated);
});

router.post("/ludo/:code/roll", async (req, res) => {
  const { username } = req.body;
  const [room] = await db.select().from(gameRoomsTable)
    .where(and(eq(gameRoomsTable.code, req.params.code.toUpperCase()), eq(gameRoomsTable.gameType, "ludo")));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  
  const settings = room.settings as any;
  const players = room.players as any[];
  const currentPlayer = players[settings.currentPlayerIdx];
  
  if (currentPlayer.username !== username) return res.status(403).json({ error: "Bukan giliranmu" });
  if (settings.diceRolled) return res.status(400).json({ error: "Sudah lempar dadu" });
  
  const dice = Math.floor(Math.random() * 6) + 1;
  
  const [updated] = await db.update(gameRoomsTable).set({
    settings: { ...settings, currentDice: dice, diceRolled: true },
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  res.json({ ...updated, rolledDice: dice });
});

router.post("/ludo/:code/move", async (req, res) => {
  const { username, tokenIdx } = req.body;
  const [room] = await db.select().from(gameRoomsTable)
    .where(and(eq(gameRoomsTable.code, req.params.code.toUpperCase()), eq(gameRoomsTable.gameType, "ludo")));
  if (!room) return res.status(404).json({ error: "Room tidak ditemukan" });
  
  const settings = room.settings as any;
  const players = room.players as any[];
  const currentPlayerIdx = settings.currentPlayerIdx;
  const currentPlayer = players[currentPlayerIdx];
  
  if (currentPlayer.username !== username) return res.status(403).json({ error: "Bukan giliranmu" });
  if (!settings.diceRolled) return res.status(400).json({ error: "Lempar dadu dulu" });
  
  const dice = settings.currentDice;
  const tokens = [...currentPlayer.tokens];
  
  // Move logic
  if (tokens[tokenIdx] === -1 && dice === 6) {
    tokens[tokenIdx] = 0;
  } else if (tokens[tokenIdx] >= 0) {
    const newPos = tokens[tokenIdx] + dice;
    tokens[tokenIdx] = newPos >= 56 ? 56 : newPos;
  }
  
  const newPlayers = players.map((p: any, i: number) =>
    i === currentPlayerIdx ? { ...p, tokens, finished: tokens.every((t: number) => t >= 56) } : p
  );
  
  // Check winner
  const winnerPlayer = newPlayers.find((p: any) => p.finished);
  let winner = null;
  let newPhase = room.phase;
  if (winnerPlayer) {
    winner = winnerPlayer.username;
    newPhase = "ended";
    await updateGameLeaderboard(winnerPlayer.username, "ludo", true, 15);
  }
  
  // Next player (skip if finished), unless dice was 6 (extra turn)
  let nextIdx = dice === 6 && !winnerPlayer ? currentPlayerIdx : (currentPlayerIdx + 1) % players.length;
  while (newPlayers[nextIdx]?.finished && nextIdx !== currentPlayerIdx) {
    nextIdx = (nextIdx + 1) % newPlayers.length;
  }
  
  const [updated] = await db.update(gameRoomsTable).set({
    players: newPlayers,
    phase: newPhase,
    winner: winner,
    settings: { ...settings, currentPlayerIdx: nextIdx, diceRolled: false, currentDice: null },
    updatedAt: new Date(),
  }).where(eq(gameRoomsTable.id, room.id)).returning();
  res.json(updated);
});

export default router;
