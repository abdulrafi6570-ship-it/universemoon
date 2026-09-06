import { Router } from "express";
import { db } from "@workspace/db";
import { battlesTable, battleMatchesTable, usersTable, sessionsTable } from "@workspace/db";
import { eq, and, gt, asc } from "drizzle-orm";

const router = Router();

async function getSessionUser(req: any): Promise<{ id: number; username: string; role: string } | null> {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const [session] = await db.select().from(sessionsTable).where(
    and(eq(sessionsTable.sessionToken, token), gt(sessionsTable.expiresAt, new Date()))
  );
  if (!session) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role };
}

async function requireAdmin(req: any) {
  const user = await getSessionUser(req);
  return user && user.role === "admin" ? user : null;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Strips the private per-side submission videos out of a match unless the
// requester is an admin — the official result video stays visible to all.
function sanitizeMatch(m: any, isAdmin: boolean) {
  if (isAdmin) return m;
  const { submission1Url, submission2Url, ...rest } = m;
  return rest;
}

// ─── LIST / VIEW ──────────────────────────────────────────────────────────────

router.get("/battles", async (req, res) => {
  const battles = await db.select().from(battlesTable).orderBy(asc(battlesTable.id));
  return res.json(battles);
});

router.get("/battles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [battle] = await db.select().from(battlesTable).where(eq(battlesTable.id, id));
  if (!battle) return res.status(404).json({ error: "Battle not found" });
  const user = await getSessionUser(req);
  const isAdmin = user?.role === "admin";
  const matches = await db.select().from(battleMatchesTable)
    .where(eq(battleMatchesTable.battleId, id))
    .orderBy(asc(battleMatchesTable.round), asc(battleMatchesTable.matchIndex));
  return res.json({ ...battle, matches: matches.map(m => sanitizeMatch(m, isAdmin)) });
});

// ─── CREATE (admin) ───────────────────────────────────────────────────────────

router.post("/battles", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin only" });

  const { title, isTeam, names } = req.body as { title?: string; isTeam?: boolean; names?: string[] };
  const cleanNames = (names || []).map(n => n.trim()).filter(Boolean);
  if (!title || cleanNames.length < 2) {
    return res.status(400).json({ error: "Judul dan minimal 2 peserta diperlukan" });
  }

  const [battle] = await db.insert(battlesTable).values({
    title, isTeam: !!isTeam, status: "ongoing", createdBy: admin.username,
  }).returning();

  const bracketSize = nextPowerOf2(cleanNames.length);
  const totalRounds = Math.log2(bracketSize);
  const slots: (string | null)[] = [...cleanNames, ...Array(bracketSize - cleanNames.length).fill(null)];

  const roundsMatches: { round: number; matchIndex: number; name1: string | null; name2: string | null; winnerName: string | null }[] = [];

  for (let i = 0; i < bracketSize / 2; i++) {
    const a = slots[i * 2];
    const b = slots[i * 2 + 1];
    const winnerName = a && !b ? a : (!a && b ? b : null);
    roundsMatches.push({ round: 0, matchIndex: i, name1: a, name2: b, winnerName });
  }
  for (let r = 1; r < totalRounds; r++) {
    const count = bracketSize / Math.pow(2, r + 1);
    for (let i = 0; i < count; i++) {
      roundsMatches.push({ round: r, matchIndex: i, name1: null, name2: null, winnerName: null });
    }
  }

  const inserted = await db.insert(battleMatchesTable).values(
    roundsMatches.map(m => ({ battleId: battle.id, ...m }))
  ).returning();

  for (const m of inserted.filter(m => m.round === 0 && m.winnerName)) {
    await advanceWinner(battle.id, m.round, m.matchIndex, m.winnerName!);
  }

  const matches = await db.select().from(battleMatchesTable)
    .where(eq(battleMatchesTable.battleId, battle.id))
    .orderBy(asc(battleMatchesTable.round), asc(battleMatchesTable.matchIndex));
  return res.json({ ...battle, matches });
});

async function advanceWinner(battleId: number, round: number, matchIndex: number, winnerName: string) {
  const nextRound = round + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const [nextMatch] = await db.select().from(battleMatchesTable).where(
    and(
      eq(battleMatchesTable.battleId, battleId),
      eq(battleMatchesTable.round, nextRound),
      eq(battleMatchesTable.matchIndex, nextMatchIndex),
    )
  );
  if (!nextMatch) return;
  const slotIsFirst = matchIndex % 2 === 0;
  await db.update(battleMatchesTable)
    .set(slotIsFirst ? { name1: winnerName } : { name2: winnerName })
    .where(eq(battleMatchesTable.id, nextMatch.id));
}

// ─── SUBMIT RAW FOOTAGE (any logged-in member, per side) ─────────────────────
// Anyone can drop the raw footage for either side of an undecided match —
// it's kept private (only admins can see/download it) until the admin
// reviews it and, separately, uploads the official result video.

router.post("/battles/:battleId/matches/:matchId/submit", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login diperlukan" });

  const battleId = parseInt(req.params.battleId);
  const matchId = parseInt(req.params.matchId);
  const { slot, url } = req.body as { slot?: 1 | 2; url?: string };
  if (!url || (slot !== 1 && slot !== 2)) {
    return res.status(400).json({ error: "slot (1 atau 2) dan url wajib diisi" });
  }

  const [match] = await db.select().from(battleMatchesTable).where(eq(battleMatchesTable.id, matchId));
  if (!match || match.battleId !== battleId) return res.status(404).json({ error: "Match not found" });
  if (match.winnerName) return res.status(400).json({ error: "Match ini sudah selesai" });

  await db.update(battleMatchesTable)
    .set(slot === 1 ? { submission1Url: url } : { submission2Url: url })
    .where(eq(battleMatchesTable.id, matchId));

  return res.json({ success: true });
});

// ─── SET WINNER (admin) ───────────────────────────────────────────────────────

router.patch("/battles/:battleId/matches/:matchId", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin only" });

  const battleId = parseInt(req.params.battleId);
  const matchId = parseInt(req.params.matchId);
  const { winnerName } = req.body as { winnerName?: string };

  const [match] = await db.select().from(battleMatchesTable).where(eq(battleMatchesTable.id, matchId));
  if (!match || match.battleId !== battleId) return res.status(404).json({ error: "Match not found" });
  if (!winnerName || (winnerName !== match.name1 && winnerName !== match.name2)) {
    return res.status(400).json({ error: "Winner must be one of the two match names" });
  }

  await db.update(battleMatchesTable).set({ winnerName }).where(eq(battleMatchesTable.id, matchId));
  await advanceWinner(battleId, match.round, match.matchIndex, winnerName);

  const [nextMatch] = await db.select().from(battleMatchesTable).where(
    and(
      eq(battleMatchesTable.battleId, battleId),
      eq(battleMatchesTable.round, match.round + 1),
      eq(battleMatchesTable.matchIndex, Math.floor(match.matchIndex / 2)),
    )
  );
  if (!nextMatch) {
    await db.update(battlesTable).set({ status: "finished" }).where(eq(battlesTable.id, battleId));
  }

  const [updatedMatch] = await db.select().from(battleMatchesTable).where(eq(battleMatchesTable.id, matchId));
  return res.json(updatedMatch);
});

// ─── SET OFFICIAL RESULT VIDEO (admin) ────────────────────────────────────────

router.patch("/battles/:battleId/matches/:matchId/result", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin only" });

  const battleId = parseInt(req.params.battleId);
  const matchId = parseInt(req.params.matchId);
  const { resultVideoUrl } = req.body as { resultVideoUrl?: string };

  const [match] = await db.select().from(battleMatchesTable).where(eq(battleMatchesTable.id, matchId));
  if (!match || match.battleId !== battleId) return res.status(404).json({ error: "Match not found" });

  await db.update(battleMatchesTable).set({ resultVideoUrl }).where(eq(battleMatchesTable.id, matchId));
  const [updatedMatch] = await db.select().from(battleMatchesTable).where(eq(battleMatchesTable.id, matchId));
  return res.json(updatedMatch);
});

// ─── THIRD PLACE (admin) ──────────────────────────────────────────────────────

router.patch("/battles/:id", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin only" });
  const id = parseInt(req.params.id);
  const { thirdPlace } = req.body as { thirdPlace?: string };
  await db.update(battlesTable).set({ thirdPlace }).where(eq(battlesTable.id, id));
  const [battle] = await db.select().from(battlesTable).where(eq(battlesTable.id, id));
  return res.json(battle);
});

// ─── DELETE (admin) ───────────────────────────────────────────────────────────

router.delete("/battles/:id", async (req, res) => {
  const admin = await requireAdmin(req);
  if (!admin) return res.status(403).json({ error: "Admin only" });
  const id = parseInt(req.params.id);
  await db.delete(battleMatchesTable).where(eq(battleMatchesTable.battleId, id));
  await db.delete(battlesTable).where(eq(battlesTable.id, id));
  return res.json({ success: true });
});

export default router;
