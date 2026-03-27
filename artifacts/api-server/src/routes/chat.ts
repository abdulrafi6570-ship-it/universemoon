import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, chatDmsTable, stickersTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";

const router = Router();

// ── GROUP CHAT ────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 150;
  const messages = await db.select().from(chatMessagesTable).orderBy(chatMessagesTable.createdAt).limit(limit);
  return res.json(messages);
});

router.post("/", async (req, res) => {
  const { sender, content, replyToId, isSticker, stickerCode } = req.body;
  if (!sender || (!content && !stickerCode)) return res.status(400).json({ error: "Sender and content required" });

  let replyToContent: string | null = null;
  let replySender: string | null = null;
  if (replyToId) {
    const [original] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, replyToId));
    if (original) {
      replyToContent = original.isSticker ? "🖼️ Stiker" : original.content;
      replySender = original.sender;
    }
  }

  const [msg] = await db.insert(chatMessagesTable).values({
    sender, content: content || "",
    replyToId: replyToId || null,
    replyToContent: replyToContent ? `${replySender}: ${replyToContent}` : null,
    isSticker: isSticker || false,
    stickerCode: stickerCode || null,
    reactions: {},
  }).returning();
  return res.json(msg);
});

router.delete("/:id", async (req, res) => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// Toggle emoji reaction on a message
router.post("/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, parseInt(req.params.id)));
  if (!msg) return res.status(404).json({ error: "Not found" });

  const reactions = (msg.reactions as Record<string, string[]>) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  const idx = reactions[emoji].indexOf(username);
  if (idx >= 0) {
    reactions[emoji].splice(idx, 1);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji].push(username);
  }

  const [updated] = await db.update(chatMessagesTable).set({ reactions }).where(eq(chatMessagesTable.id, parseInt(req.params.id))).returning();
  return res.json(updated);
});

// ── STICKERS ──────────────────────────────────────────────────────────────────

router.get("/stickers", async (req, res) => {
  const stickers = await db.select().from(stickersTable).orderBy(stickersTable.createdAt);
  res.json(stickers);
});

router.post("/stickers", async (req, res) => {
  const { name, fileUrl, category, addedBy } = req.body;
  if (!name || !fileUrl) return res.status(400).json({ error: "Missing fields" });
  const [s] = await db.insert(stickersTable).values({ name, fileUrl, category: category || "general", addedBy }).returning();
  res.json(s);
});

router.delete("/stickers/:id", async (req, res) => {
  await db.delete(stickersTable).where(eq(stickersTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

// ── PRIVATE DMs ───────────────────────────────────────────────────────────────

router.get("/dm/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;
  const msgs = await db.select().from(chatDmsTable).where(
    or(
      and(eq(chatDmsTable.fromUsername, userA), eq(chatDmsTable.toUsername, userB)),
      and(eq(chatDmsTable.fromUsername, userB), eq(chatDmsTable.toUsername, userA)),
    )
  ).orderBy(chatDmsTable.createdAt);
  res.json(msgs);
});

router.post("/dm", async (req, res) => {
  const { fromUsername, toUsername, content, stickerUrl } = req.body;
  if (!fromUsername || !toUsername || (!content && !stickerUrl)) return res.status(400).json({ error: "Missing fields" });
  const [dm] = await db.insert(chatDmsTable).values({
    fromUsername, toUsername,
    content: content || "",
    stickerUrl: stickerUrl || null,
    isRead: false,
  }).returning();
  res.json(dm);
});

router.get("/dm-list/:username", async (req, res) => {
  const { username } = req.params;
  const msgs = await db.select().from(chatDmsTable).where(
    or(eq(chatDmsTable.fromUsername, username), eq(chatDmsTable.toUsername, username))
  ).orderBy(desc(chatDmsTable.createdAt));

  const partners = new Map<string, any>();
  for (const msg of msgs) {
    const partner = msg.fromUsername === username ? msg.toUsername : msg.fromUsername;
    if (!partners.has(partner)) partners.set(partner, { partner, lastMessage: msg });
  }
  res.json(Array.from(partners.values()));
});

export default router;
