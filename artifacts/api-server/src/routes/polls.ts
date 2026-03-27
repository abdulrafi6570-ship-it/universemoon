import { Router } from "express";
import { db } from "@workspace/db";
import { pollsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const polls = await db.select().from(pollsTable).orderBy(desc(pollsTable.createdAt));
  return res.json(polls);
});

router.post("/", async (req, res) => {
  const { question, options, createdBy } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2)
    return res.status(400).json({ error: "Question and at least 2 options required" });
  const formattedOptions = options.map((label: string) => ({ label, votes: [] as string[] }));
  const [poll] = await db.insert(pollsTable).values({
    question, options: formattedOptions, comments: [], createdBy, isOpen: true,
  }).returning();
  return res.json(poll);
});

router.post("/:id/vote", async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, optionIndex } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, id));
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const options = (poll.options as any[]).map((opt, i) => {
    const votes: string[] = opt.votes || [];
    const alreadyVoted = votes.includes(username);
    if (i === optionIndex && !alreadyVoted) {
      return { ...opt, votes: [...votes, username] };
    }
    if (alreadyVoted && i !== optionIndex) {
      return { ...opt, votes: votes.filter((v: string) => v !== username) };
    }
    return opt;
  });

  const [updated] = await db.update(pollsTable).set({ options }).where(eq(pollsTable.id, id)).returning();
  return res.json(updated);
});

router.post("/:id/comment", async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, content } = req.body;
  if (!username || !content) return res.status(400).json({ error: "Username and content required" });

  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, id));
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const comments = [...((poll.comments as any[]) || []), {
    username, content, createdAt: new Date().toISOString(),
  }];
  const [updated] = await db.update(pollsTable).set({ comments }).where(eq(pollsTable.id, id)).returning();
  return res.json(updated);
});

router.patch("/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, id));
  if (!poll) return res.status(404).json({ error: "Not found" });
  const [updated] = await db.update(pollsTable).set({ isOpen: !poll.isOpen }).where(eq(pollsTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db.delete(pollsTable).where(eq(pollsTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

export default router;
