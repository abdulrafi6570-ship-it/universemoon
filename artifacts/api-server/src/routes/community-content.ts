import { Router } from "express";
import { db } from "@workspace/db";
import { quotesTable, fanficsTable, capsulesTable, qaTable, playlistTable, rulesTable, customStickersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// ─── QUOTES ─────────────────────────────────────────────────────────────────

router.get("/quotes", async (req, res) => {
  const quotes = await db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt));
  return res.json(quotes);
});

router.get("/quotes/active", async (req, res) => {
  const [quote] = await db.select().from(quotesTable).where(eq(quotesTable.isActive, true)).orderBy(desc(quotesTable.createdAt)).limit(1);
  return res.json(quote || null);
});

router.post("/quotes", async (req, res) => {
  const { content, author, submittedBy, date } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });
  const [quote] = await db.insert(quotesTable).values({ content, author, submittedBy, date: date || new Date().toISOString().split('T')[0], isActive: false }).returning();
  return res.json(quote);
});

router.patch("/quotes/:id/activate", async (req, res) => {
  await db.update(quotesTable).set({ isActive: false });
  const [updated] = await db.update(quotesTable).set({ isActive: true }).where(eq(quotesTable.id, parseInt(req.params.id))).returning();
  return res.json(updated);
});

router.delete("/quotes/:id", async (req, res) => {
  await db.delete(quotesTable).where(eq(quotesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── FANFICS ─────────────────────────────────────────────────────────────────

router.get("/fanfics", async (req, res) => {
  const fanfics = await db.select().from(fanficsTable).orderBy(desc(fanficsTable.createdAt));
  return res.json(fanfics);
});

router.get("/fanfics/:id", async (req, res) => {
  const [fanfic] = await db.select().from(fanficsTable).where(eq(fanficsTable.id, parseInt(req.params.id)));
  if (!fanfic) return res.status(404).json({ error: "Not found" });
  await db.update(fanficsTable).set({ views: (fanfic.views || 0) + 1 }).where(eq(fanficsTable.id, fanfic.id));
  return res.json(fanfic);
});

router.post("/fanfics", async (req, res) => {
  const { title, content, genre, authorUsername } = req.body;
  if (!title || !content || !authorUsername) return res.status(400).json({ error: "Missing fields" });
  const [fanfic] = await db.insert(fanficsTable).values({ title, content, genre: genre || "General", authorUsername, likes: [], views: 0 }).returning();
  return res.json(fanfic);
});

router.post("/fanfics/:id/like", async (req, res) => {
  const { username } = req.body;
  const id = parseInt(req.params.id);
  const [fanfic] = await db.select().from(fanficsTable).where(eq(fanficsTable.id, id));
  if (!fanfic) return res.status(404).json({ error: "Not found" });
  const likes = (fanfic.likes as string[]) || [];
  const idx = likes.indexOf(username);
  const newLikes = idx >= 0 ? likes.filter(l => l !== username) : [...likes, username];
  const [updated] = await db.update(fanficsTable).set({ likes: newLikes }).where(eq(fanficsTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/fanfics/:id", async (req, res) => {
  await db.delete(fanficsTable).where(eq(fanficsTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── CAPSULES (Time Capsule) ─────────────────────────────────────────────────

router.get("/capsules", async (req, res) => {
  const capsules = await db.select().from(capsulesTable).orderBy(desc(capsulesTable.createdAt));
  const today = new Date().toISOString().split('T')[0];
  const result = capsules.map(c => {
    const shouldReveal = c.revealDate <= today;
    if (shouldReveal && !c.isRevealed) {
      db.update(capsulesTable).set({ isRevealed: true }).where(eq(capsulesTable.id, c.id));
      return { ...c, isRevealed: true };
    }
    if (!shouldReveal) return { ...c, content: "🔒 Belum saatnya dibuka..." };
    return c;
  });
  return res.json(result);
});

router.post("/capsules", async (req, res) => {
  const { authorUsername, title, content, revealDate } = req.body;
  if (!authorUsername || !title || !content || !revealDate) return res.status(400).json({ error: "Missing fields" });
  const [capsule] = await db.insert(capsulesTable).values({ authorUsername, title, content, revealDate, isRevealed: false, reactions: {} }).returning();
  return res.json({ ...capsule, content: capsule.isRevealed ? capsule.content : "🔒 Belum saatnya dibuka..." });
});

router.post("/capsules/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const id = parseInt(req.params.id);
  const [item] = await db.select().from(capsulesTable).where(eq(capsulesTable.id, id));
  if (!item || !item.isRevealed) return res.status(403).json({ error: "Capsule not revealed yet" });
  const reactions = (item.reactions as Record<string, string[]>) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  const idx = reactions[emoji].indexOf(username);
  if (idx >= 0) { reactions[emoji].splice(idx, 1); if (!reactions[emoji].length) delete reactions[emoji]; }
  else reactions[emoji].push(username);
  const [updated] = await db.update(capsulesTable).set({ reactions }).where(eq(capsulesTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/capsules/:id", async (req, res) => {
  await db.delete(capsulesTable).where(eq(capsulesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── Q&A ─────────────────────────────────────────────────────────────────────

router.get("/qa", async (req, res) => {
  const { member } = req.query;
  let query = db.select().from(qaTable);
  const items = await db.select().from(qaTable).orderBy(desc(qaTable.createdAt));
  const filtered = member ? items.filter(i => i.targetMember === member) : items;
  return res.json(filtered.filter(i => i.isPublic || req.query.all === 'true'));
});

router.get("/qa/:member", async (req, res) => {
  const items = await db.select().from(qaTable)
    .where(eq(qaTable.targetMember, req.params.member))
    .orderBy(desc(qaTable.createdAt));
  return res.json(items.filter(i => i.isPublic));
});

router.get("/qa/:member/inbox", async (req, res) => {
  const items = await db.select().from(qaTable)
    .where(eq(qaTable.targetMember, req.params.member))
    .orderBy(desc(qaTable.createdAt));
  return res.json(items);
});

router.post("/qa", async (req, res) => {
  const { targetMember, question } = req.body;
  if (!targetMember || !question) return res.status(400).json({ error: "Missing fields" });
  const [qa] = await db.insert(qaTable).values({ targetMember, question, isAnswered: false, isPublic: false }).returning();
  return res.json(qa);
});

router.patch("/qa/:id/answer", async (req, res) => {
  const { answer, isPublic } = req.body;
  const [updated] = await db.update(qaTable).set({ answer, isAnswered: true, isPublic: isPublic ?? true }).where(eq(qaTable.id, parseInt(req.params.id))).returning();
  return res.json(updated);
});

router.delete("/qa/:id", async (req, res) => {
  await db.delete(qaTable).where(eq(qaTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── PLAYLIST ─────────────────────────────────────────────────────────────────

router.get("/playlist-votes", async (req, res) => {
  const songs = await db.select().from(playlistTable).orderBy(desc(playlistTable.createdAt));
  return res.json(songs);
});

router.post("/playlist-votes", async (req, res) => {
  const { title, artist, youtubeUrl, addedBy } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  const [song] = await db.insert(playlistTable).values({ title, artist, youtubeUrl, addedBy, votes: [] }).returning();
  return res.json(song);
});

router.post("/playlist-votes/:id/vote", async (req, res) => {
  const { username } = req.body;
  const id = parseInt(req.params.id);
  const [song] = await db.select().from(playlistTable).where(eq(playlistTable.id, id));
  if (!song) return res.status(404).json({ error: "Not found" });
  const votes = (song.votes as string[]) || [];
  const idx = votes.indexOf(username);
  const newVotes = idx >= 0 ? votes.filter(v => v !== username) : [...votes, username];
  const [updated] = await db.update(playlistTable).set({ votes: newVotes }).where(eq(playlistTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/playlist-votes/:id", async (req, res) => {
  await db.delete(playlistTable).where(eq(playlistTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── RULES ────────────────────────────────────────────────────────────────────

router.get("/rules", async (req, res) => {
  const rules = await db.select().from(rulesTable).orderBy(rulesTable.order, rulesTable.createdAt);
  return res.json(rules);
});

router.post("/rules", async (req, res) => {
  const { title, content, category, order } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });
  const [rule] = await db.insert(rulesTable).values({ title, content, category: category || "Umum", order: order || 0 }).returning();
  return res.json(rule);
});

router.patch("/rules/:id", async (req, res) => {
  const { title, content, category, order } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (category !== undefined) updates.category = category;
  if (order !== undefined) updates.order = order;
  const [updated] = await db.update(rulesTable).set(updates).where(eq(rulesTable.id, parseInt(req.params.id))).returning();
  return res.json(updated);
});

router.delete("/rules/:id", async (req, res) => {
  await db.delete(rulesTable).where(eq(rulesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── CUSTOM STICKERS ──────────────────────────────────────────────────────────

router.get("/custom-stickers", async (req, res) => {
  const stickers = await db.select().from(customStickersTable).orderBy(customStickersTable.category, desc(customStickersTable.createdAt));
  return res.json(stickers);
});

router.post("/custom-stickers", async (req, res) => {
  const { name, url, category, addedBy } = req.body;
  if (!name || !url) return res.status(400).json({ error: "name and url required" });
  const [sticker] = await db.insert(customStickersTable).values({ name, url, category: category || "General", addedBy }).returning();
  return res.json(sticker);
});

router.delete("/custom-stickers/:id", async (req, res) => {
  await db.delete(customStickersTable).where(eq(customStickersTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

export default router;
