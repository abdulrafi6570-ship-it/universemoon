import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
    avatarUrl: usersTable.avatarUrl,
    xp: usersTable.xp,
    level: usersTable.level,
    isBanned: usersTable.isBanned,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);
  return res.json(users);
});

router.post("/:id/ban", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "User not found" });
  await db.update(usersTable).set({ isBanned: !user.isBanned }).where(eq(usersTable.id, id));
  return res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ success: true });
});

// Update last seen
router.post("/seen", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) return res.json({ success: false });

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Update streak if first visit today
  let newStreak = user.streak;
  if (user.streakUpdatedAt) {
    const lastDate = user.streakUpdatedAt.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDate === today) {
      // Already updated today, just update lastSeen
    } else if (lastDate === yesterdayStr) {
      // Consecutive day
      newStreak = (user.streak || 0) + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const shouldUpdateStreak = !user.streakUpdatedAt || user.streakUpdatedAt.toISOString().split('T')[0] !== today;
  
  await db.update(usersTable).set({
    lastSeen: now,
    streak: newStreak,
    ...(shouldUpdateStreak ? { streakUpdatedAt: now } : {}),
  }).where(eq(usersTable.username, username));

  return res.json({ success: true, streak: newStreak });
});

export default router;
