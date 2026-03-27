import { Router } from "express";
import { db } from "@workspace/db";
import { membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
  return res.json(members);
});

router.post("/", async (req, res) => {
  const { name, nickname, role, bio, joinDate, favoriteSong, socialLinks, avatarUrl } = req.body;
  if (!name || !nickname) return res.status(400).json({ error: "Name and nickname required" });
  const [member] = await db.insert(membersTable).values({ name, nickname, role: role || "Member", bio, joinDate, favoriteSong, socialLinks, avatarUrl, isActive: true }).returning();
  return res.json(member);
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, nickname, role, bio, favoriteSong, socialLinks, avatarUrl } = req.body;
  const [member] = await db.update(membersTable)
    .set({ name, nickname, role, bio, favoriteSong, socialLinks, avatarUrl })
    .where(eq(membersTable.id, id))
    .returning();
  return res.json(member);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(membersTable).where(eq(membersTable.id, id));
  return res.json({ success: true });
});

router.post("/:id/kick", async (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: "Reason required" });
  const kickDate = new Date().toISOString().split("T")[0];
  await db.update(membersTable).set({ isActive: false, kickReason: reason, kickDate }).where(eq(membersTable.id, id));
  return res.json({ success: true });
});

export default router;
