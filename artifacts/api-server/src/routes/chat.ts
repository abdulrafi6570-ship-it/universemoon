import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const messages = await db.select().from(chatMessagesTable).orderBy(chatMessagesTable.createdAt).limit(limit);
  return res.json(messages);
});

router.post("/", async (req, res) => {
  const { sender, content, replyToId, isSticker, stickerCode } = req.body;
  if (!sender || !content) return res.status(400).json({ error: "Sender and content required" });

  let replyToContent = null;
  if (replyToId) {
    const [original] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, replyToId));
    if (original) replyToContent = original.content;
  }

  const [msg] = await db.insert(chatMessagesTable).values({ sender, content, replyToId, replyToContent, isSticker, stickerCode, reactions: {} }).returning();
  return res.json(msg);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  return res.json({ success: true });
});

export default router;
