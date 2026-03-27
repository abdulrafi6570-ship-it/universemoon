import { Router } from "express";
import { db } from "@workspace/db";
import { nglMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const messages = await db.select().from(nglMessagesTable).orderBy(nglMessagesTable.createdAt);
  return res.json(messages);
});

router.post("/", async (req, res) => {
  const { content, recipient } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  const [msg] = await db.insert(nglMessagesTable).values({ content, recipient: recipient || null, reactions: {} }).returning();
  return res.json(msg);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(nglMessagesTable).where(eq(nglMessagesTable.id, id));
  return res.json({ success: true });
});

export default router;
