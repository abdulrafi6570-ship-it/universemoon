import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;
