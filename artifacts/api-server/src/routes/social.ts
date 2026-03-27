import { Router } from "express";
import { db } from "@workspace/db";
import { reactionsTable, votesTable, chatMessagesTable, nglMessagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// REACTIONS
router.post("/reactions", async (req, res) => {
  const { contentType, contentId, emoji, username } = req.body;
  if (!contentType || !contentId || !emoji || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Toggle reaction
  const existing = await db.select().from(reactionsTable)
    .where(and(
      eq(reactionsTable.contentType, contentType),
      eq(reactionsTable.contentId, contentId),
      eq(reactionsTable.emoji, emoji),
      eq(reactionsTable.username, username)
    ));

  if (existing.length > 0) {
    await db.delete(reactionsTable).where(eq(reactionsTable.id, existing[0].id));
  } else {
    await db.insert(reactionsTable).values({ contentType, contentId, emoji, username });
  }

  // Update reactions on the content
  const allReactions = await db.select().from(reactionsTable)
    .where(and(eq(reactionsTable.contentType, contentType), eq(reactionsTable.contentId, contentId)));

  const reactionCounts: Record<string, number> = {};
  for (const r of allReactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  }

  // Update on chat message or ngl
  if (contentType === "chat") {
    await db.update(chatMessagesTable).set({ reactions: reactionCounts }).where(eq(chatMessagesTable.id, contentId));
  } else if (contentType === "ngl") {
    await db.update(nglMessagesTable).set({ reactions: reactionCounts }).where(eq(nglMessagesTable.id, contentId));
  }

  return res.json({ success: true });
});

// VOTES
router.get("/votes", async (req, res) => {
  const topic = req.query.topic as string;
  if (!topic) return res.status(400).json({ error: "Topic required" });

  const votes = await db.select().from(votesTable).where(eq(votesTable.topic, topic));
  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v.option] = (voteCounts[v.option] || 0) + 1;
  }

  return res.json({ topic, votes: voteCounts, totalVotes: votes.length });
});

router.post("/votes", async (req, res) => {
  const { topic, option, username } = req.body;
  if (!topic || !option || !username) return res.status(400).json({ error: "Missing fields" });

  // One vote per user per topic
  const existing = await db.select().from(votesTable)
    .where(and(eq(votesTable.topic, topic), eq(votesTable.username, username)));

  if (existing.length > 0) {
    await db.update(votesTable).set({ option }).where(eq(votesTable.id, existing[0].id));
  } else {
    await db.insert(votesTable).values({ topic, option, username });
  }

  return res.json({ success: true });
});

router.post("/votes/reset", async (req, res) => {
  const { topic } = req.body;
  if (topic) {
    await db.delete(votesTable).where(eq(votesTable.topic, topic));
  } else {
    await db.delete(votesTable);
  }
  return res.json({ success: true });
});

export default router;
