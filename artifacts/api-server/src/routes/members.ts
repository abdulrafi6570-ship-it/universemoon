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
  const { name, nickname, role, bio, joinDate, specialty, favoriteSong, socialLinks, avatarUrl } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const [member] = await db.insert(membersTable).values({
    name, nickname: nickname || name, role: role || "Member",
    bio, joinDate, specialty, favoriteSong, socialLinks, avatarUrl, isActive: true,
  }).returning();
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
  const kickDate = new Date().toISOString().split("T")[0];
  await db.update(membersTable).set({ isActive: false, kickReason: reason || "Kicked by admin", kickDate }).where(eq(membersTable.id, id));
  return res.json({ success: true });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, nickname, role, bio, joinDate, specialty, favoriteSong, socialLinks, avatarUrl, isActive } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (nickname !== undefined) updates.nickname = nickname;
  if (role !== undefined) updates.role = role;
  if (bio !== undefined) updates.bio = bio;
  if (joinDate !== undefined) updates.joinDate = joinDate;
  if (specialty !== undefined) updates.specialty = specialty;
  if (favoriteSong !== undefined) updates.favoriteSong = favoriteSong;
  if (socialLinks !== undefined) updates.socialLinks = socialLinks;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (isActive !== undefined) updates.isActive = isActive;
  const [member] = await db.update(membersTable).set(updates).where(eq(membersTable.id, id)).returning();
  return res.json(member);
});

export default router;
