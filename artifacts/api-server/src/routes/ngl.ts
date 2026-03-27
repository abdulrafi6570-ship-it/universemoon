import { Router } from "express";
import { db } from "@workspace/db";
import { nglMessagesTable, nglReactionsTable, nglCommentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const messages = await db.select().from(nglMessagesTable).orderBy(desc(nglMessagesTable.createdAt));
  const allComments = await db.select().from(nglCommentsTable).orderBy(nglCommentsTable.createdAt);
  const result = messages.map(msg => ({
    ...msg,
    comments: allComments.filter(c => c.nglId === msg.id),
  }));
  return res.json(result);
});

router.post("/", async (req, res) => {
  const { content, recipient } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  const [msg] = await db.insert(nglMessagesTable).values({ content, recipient: recipient || null, reactions: {} }).returning();
  return res.json(msg);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(nglCommentsTable).where(eq(nglCommentsTable.nglId, id));
  await db.delete(nglReactionsTable).where(eq(nglReactionsTable.nglId, id));
  await db.delete(nglMessagesTable).where(eq(nglMessagesTable.id, id));
  return res.json({ success: true });
});

// Reactions on NGL messages
router.post("/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const id = parseInt(req.params.id);
  const [msg] = await db.select().from(nglMessagesTable).where(eq(nglMessagesTable.id, id));
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
  const [updated] = await db.update(nglMessagesTable).set({ reactions }).where(eq(nglMessagesTable.id, id)).returning();
  return res.json(updated);
});

// Comments on NGL messages
router.get("/:id/comments", async (req, res) => {
  const comments = await db.select().from(nglCommentsTable)
    .where(eq(nglCommentsTable.nglId, parseInt(req.params.id)))
    .orderBy(nglCommentsTable.createdAt);
  res.json(comments);
});

router.post("/:id/comments", async (req, res) => {
  const { username, content } = req.body;
  if (!username || !content) return res.status(400).json({ error: "Missing fields" });
  const [comment] = await db.insert(nglCommentsTable).values({
    nglId: parseInt(req.params.id), username, content,
  }).returning();
  res.json(comment);
});

router.delete("/:nglId/comments/:commentId", async (req, res) => {
  await db.delete(nglCommentsTable).where(eq(nglCommentsTable.id, parseInt(req.params.commentId)));
  res.json({ success: true });
});

export default router;
