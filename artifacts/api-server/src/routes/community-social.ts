import { Router } from "express";
import { db } from "@workspace/db";
import { storiesTable, shoutoutsTable, moodsTable, memesTable } from "@workspace/db";
import { eq, desc, gt } from "drizzle-orm";

const router = Router();

// ─── STORIES (24hr status) ─────────────────────────────────────────────────

router.get("/stories", async (req, res) => {
  const now = new Date();
  const stories = await db.select().from(storiesTable)
    .where(gt(storiesTable.expiresAt, now))
    .orderBy(desc(storiesTable.createdAt));
  return res.json(stories);
});

router.post("/stories", async (req, res) => {
  const { username, content, emoji, color } = req.body;
  if (!username || !content) return res.status(400).json({ error: "username and content required" });
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [story] = await db.insert(storiesTable).values({ username, content, emoji: emoji || "✨", color: color || "#ffffff", expiresAt }).returning();
  return res.json(story);
});

router.delete("/stories/:id", async (req, res) => {
  await db.delete(storiesTable).where(eq(storiesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── SHOUTOUTS ──────────────────────────────────────────────────────────────

router.get("/shoutouts", async (req, res) => {
  const shoutouts = await db.select().from(shoutoutsTable).orderBy(desc(shoutoutsTable.createdAt));
  return res.json(shoutouts);
});

router.post("/shoutouts", async (req, res) => {
  const { fromUsername, toUsername, content } = req.body;
  if (!fromUsername || !toUsername || !content) return res.status(400).json({ error: "Missing fields" });
  const [shoutout] = await db.insert(shoutoutsTable).values({ fromUsername, toUsername, content, reactions: {} }).returning();
  return res.json(shoutout);
});

router.post("/shoutouts/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(shoutoutsTable).where(eq(shoutoutsTable.id, id));
  if (!item) return res.status(404).json({ error: "Not found" });
  const reactions = (item.reactions as Record<string, string[]>) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  const idx = reactions[emoji].indexOf(username);
  if (idx >= 0) { reactions[emoji].splice(idx, 1); if (!reactions[emoji].length) delete reactions[emoji]; }
  else reactions[emoji].push(username);
  const [updated] = await db.update(shoutoutsTable).set({ reactions }).where(eq(shoutoutsTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/shoutouts/:id", async (req, res) => {
  await db.delete(shoutoutsTable).where(eq(shoutoutsTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── MOODS ──────────────────────────────────────────────────────────────────

router.get("/moods", async (req, res) => {
  const moods = await db.select().from(moodsTable).orderBy(desc(moodsTable.updatedAt));
  return res.json(moods);
});

router.post("/moods", async (req, res) => {
  const { username, mood, emoji, color } = req.body;
  if (!username || !mood) return res.status(400).json({ error: "username and mood required" });
  const existing = await db.select().from(moodsTable).where(eq(moodsTable.username, username));
  let result;
  if (existing.length > 0) {
    [result] = await db.update(moodsTable).set({ mood, emoji: emoji || "😊", color: color || "#ffffff", updatedAt: new Date() }).where(eq(moodsTable.username, username)).returning();
  } else {
    [result] = await db.insert(moodsTable).values({ username, mood, emoji: emoji || "😊", color: color || "#ffffff" }).returning();
  }
  return res.json(result);
});

router.delete("/moods/:username", async (req, res) => {
  await db.delete(moodsTable).where(eq(moodsTable.username, req.params.username));
  return res.json({ success: true });
});

// ─── MEMES ──────────────────────────────────────────────────────────────────

router.get("/memes", async (req, res) => {
  const memes = await db.select().from(memesTable).orderBy(desc(memesTable.createdAt));
  return res.json(memes);
});

router.post("/memes", async (req, res) => {
  const { fileUrl, caption, uploadedBy } = req.body;
  if (!fileUrl) return res.status(400).json({ error: "fileUrl required" });
  const [meme] = await db.insert(memesTable).values({ fileUrl, caption, uploadedBy, reactions: {} }).returning();
  return res.json(meme);
});

router.post("/memes/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(memesTable).where(eq(memesTable.id, id));
  if (!item) return res.status(404).json({ error: "Not found" });
  const reactions = (item.reactions as Record<string, string[]>) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  const idx = reactions[emoji].indexOf(username);
  if (idx >= 0) { reactions[emoji].splice(idx, 1); if (!reactions[emoji].length) delete reactions[emoji]; }
  else reactions[emoji].push(username);
  const [updated] = await db.update(memesTable).set({ reactions }).where(eq(memesTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/memes/:id", async (req, res) => {
  await db.delete(memesTable).where(eq(memesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

export default router;
