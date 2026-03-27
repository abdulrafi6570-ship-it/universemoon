import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, gameLeaderboardTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";

const router = Router();

function getLevel(xp: number): number {
  if (xp < 10) return 1;
  if (xp < 30) return 2;
  if (xp < 60) return 3;
  if (xp < 100) return 4;
  if (xp < 150) return 5;
  if (xp < 220) return 6;
  if (xp < 300) return 7;
  if (xp < 400) return 8;
  if (xp < 550) return 9;
  return 10;
}

router.get("/", async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    xp: usersTable.xp,
    level: usersTable.level,
  }).from(usersTable).orderBy(desc(usersTable.xp));

  const leaderboard = users.map((u, i) => ({ ...u, rank: i + 1, level: getLevel(u.xp) }));
  return res.json(leaderboard);
});

router.get("/games", async (req, res) => {
  try {
    const rows = await db.select().from(gameLeaderboardTable).orderBy(desc(gameLeaderboardTable.wins));
    return res.json(rows);
  } catch {
    return res.json([]);
  }
});

router.post("/reset", async (req, res) => {
  await db.update(usersTable).set({ xp: 0, level: 1 });
  return res.json({ success: true });
});

// Add XP endpoint
router.post("/xp", async (req, res) => {
  const { username, amount } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) return res.status(404).json({ error: "User not found" });
  const newXp = user.xp + (amount || 1);
  const newLevel = getLevel(newXp);
  await db.update(usersTable).set({ xp: newXp, level: newLevel }).where(eq(usersTable.id, user.id));
  return res.json({ success: true, xp: newXp, level: newLevel });
});

export default router;
