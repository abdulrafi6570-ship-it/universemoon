import { Router } from "express";
import { db } from "@workspace/db";
import {
  milestonesTable, diaryTable, diaryEntriesTable, birthdaysTable,
  usersTable, membersTable, chatMessagesTable, photosTable,
  memoriesTable, musicTable, gameLeaderboardTable, fanficsTable, memesTable,
  shoutoutsTable, storiesTable, moodsTable
} from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

const router = Router();

// ─── MILESTONES ───────────────────────────────────────────────────────────────

router.get("/milestones", async (req, res) => {
  const milestones = await db.select().from(milestonesTable).orderBy(milestonesTable.date);
  return res.json(milestones);
});

router.post("/milestones", async (req, res) => {
  const { title, description, date, icon, addedBy } = req.body;
  if (!title || !date) return res.status(400).json({ error: "title and date required" });
  const [ms] = await db.insert(milestonesTable).values({ title, description, date, icon: icon || "⭐", addedBy }).returning();
  return res.json(ms);
});

router.delete("/milestones/:id", async (req, res) => {
  await db.delete(milestonesTable).where(eq(milestonesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── MINI DIARY ───────────────────────────────────────────────────────────────

router.get("/diary", async (req, res) => {
  const questions = await db.select().from(diaryTable).orderBy(desc(diaryTable.createdAt));
  const entries = await db.select().from(diaryEntriesTable).orderBy(diaryEntriesTable.createdAt);
  const result = questions.map(q => ({
    ...q,
    entries: entries.filter(e => e.diaryId === q.id),
  }));
  return res.json(result);
});

router.get("/diary/today", async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const [question] = await db.select().from(diaryTable).where(eq(diaryTable.date, today));
  if (!question) return res.json(null);
  const entries = await db.select().from(diaryEntriesTable).where(eq(diaryEntriesTable.diaryId, question.id)).orderBy(diaryEntriesTable.createdAt);
  return res.json({ ...question, entries });
});

router.post("/diary", async (req, res) => {
  const { question, date, createdBy } = req.body;
  if (!question) return res.status(400).json({ error: "question required" });
  const [q] = await db.insert(diaryTable).values({ question, date: date || new Date().toISOString().split('T')[0], createdBy }).returning();
  return res.json(q);
});

router.post("/diary/:id/entries", async (req, res) => {
  const { username, content } = req.body;
  if (!username || !content) return res.status(400).json({ error: "username and content required" });
  const [entry] = await db.insert(diaryEntriesTable).values({ diaryId: parseInt(req.params.id), username, content, reactions: {} }).returning();
  return res.json(entry);
});

router.post("/diary/entries/:id/react", async (req, res) => {
  const { username, emoji } = req.body;
  const id = parseInt(req.params.id);
  const [entry] = await db.select().from(diaryEntriesTable).where(eq(diaryEntriesTable.id, id));
  if (!entry) return res.status(404).json({ error: "Not found" });
  const reactions = (entry.reactions as Record<string, string[]>) || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  const idx = reactions[emoji].indexOf(username);
  if (idx >= 0) { reactions[emoji].splice(idx, 1); if (!reactions[emoji].length) delete reactions[emoji]; }
  else reactions[emoji].push(username);
  const [updated] = await db.update(diaryEntriesTable).set({ reactions }).where(eq(diaryEntriesTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/diary/:id", async (req, res) => {
  await db.delete(diaryEntriesTable).where(eq(diaryEntriesTable.diaryId, parseInt(req.params.id)));
  await db.delete(diaryTable).where(eq(diaryTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// ─── BIRTHDAYS ────────────────────────────────────────────────────────────────

router.get("/birthdays", async (req, res) => {
  const birthdays = await db.select().from(birthdaysTable).orderBy(birthdaysTable.birthDate);
  return res.json(birthdays);
});

router.post("/birthdays", async (req, res) => {
  const { username, memberName, birthDate } = req.body;
  if (!username || !birthDate) return res.status(400).json({ error: "username and birthDate required" });
  const existing = await db.select().from(birthdaysTable).where(eq(birthdaysTable.username, username));
  let result;
  if (existing.length > 0) {
    [result] = await db.update(birthdaysTable).set({ birthDate, memberName }).where(eq(birthdaysTable.username, username)).returning();
  } else {
    [result] = await db.insert(birthdaysTable).values({ username, memberName, birthDate }).returning();
  }
  return res.json(result);
});

router.delete("/birthdays/:username", async (req, res) => {
  await db.delete(birthdaysTable).where(eq(birthdaysTable.username, req.params.username));
  return res.json({ success: true });
});

// ─── STATISTICS ───────────────────────────────────────────────────────────────

router.get("/stats", async (req, res) => {
  const [members] = await db.select({ count: count() }).from(membersTable).where(eq(membersTable.isActive, true));
  const [allMessages] = await db.select({ count: count() }).from(chatMessagesTable);
  const [photos] = await db.select({ count: count() }).from(photosTable);
  const [memories] = await db.select({ count: count() }).from(memoriesTable);
  const [songs] = await db.select({ count: count() }).from(musicTable);
  const [fanfics] = await db.select({ count: count() }).from(fanficsTable);
  const [memes] = await db.select({ count: count() }).from(memesTable);
  const [stories] = await db.select({ count: count() }).from(storiesTable);
  const [shoutouts] = await db.select({ count: count() }).from(shoutoutsTable);
  const founded = new Date("2025-11-30");
  const daysSinceFounded = Math.floor((Date.now() - founded.getTime()) / (1000 * 60 * 60 * 24));
  return res.json({
    members: members.count,
    messages: allMessages.count,
    photos: photos.count,
    memories: memories.count,
    songs: songs.count,
    fanfics: fanfics.count,
    memes: memes.count,
    stories: stories.count,
    shoutouts: shoutouts.count,
    daysSinceFounded,
  });
});

// ─── HALL OF FAME ─────────────────────────────────────────────────────────────

router.get("/hall-of-fame", async (req, res) => {
  const topXp = await db.select({ username: usersTable.username, xp: usersTable.xp, avatarUrl: usersTable.avatarUrl }).from(usersTable).orderBy(desc(usersTable.xp)).limit(5);
  const topStreak = await db.select({ username: usersTable.username, streak: usersTable.streak, avatarUrl: usersTable.avatarUrl }).from(usersTable).orderBy(desc(usersTable.streak)).limit(5);
  const allLeaderboard = await db.select().from(gameLeaderboardTable).orderBy(desc(gameLeaderboardTable.wins));
  const gameWins: Record<string, number> = {};
  for (const g of allLeaderboard) {
    if (g.username) gameWins[g.username] = (gameWins[g.username] || 0) + (g.wins || 0);
  }
  const topGames = Object.entries(gameWins).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([username, wins]) => ({ username, wins }));
  return res.json({ topXp, topStreak, topGames });
});

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────

router.get("/activity", async (req, res) => {
  const [recentPhotos, recentMemories, recentShoutouts, recentFanfics, recentMemes] = await Promise.all([
    db.select().from(photosTable).orderBy(desc(photosTable.createdAt)).limit(5),
    db.select().from(memoriesTable).orderBy(desc(memoriesTable.createdAt)).limit(5),
    db.select().from(shoutoutsTable).orderBy(desc(shoutoutsTable.createdAt)).limit(5),
    db.select().from(fanficsTable).orderBy(desc(fanficsTable.createdAt)).limit(5),
    db.select().from(memesTable).orderBy(desc(memesTable.createdAt)).limit(5),
  ]);
  const activities = [
    ...recentPhotos.map(p => ({ type: 'photo', icon: '📸', text: `${p.uploadedBy || 'Someone'} upload foto baru`, caption: p.caption, time: p.createdAt })),
    ...recentMemories.map(m => ({ type: 'memory', icon: '📖', text: `${m.addedBy || 'Someone'} tambah kenangan`, caption: m.title, time: m.createdAt })),
    ...recentShoutouts.map(s => ({ type: 'shoutout', icon: '📣', text: `${s.fromUsername} give shoutout ke ${s.toUsername}`, caption: s.content, time: s.createdAt })),
    ...recentFanfics.map(f => ({ type: 'fanfic', icon: '✍️', text: `${f.authorUsername} post cerita baru`, caption: f.title, time: f.createdAt })),
    ...recentMemes.map(m => ({ type: 'meme', icon: '😂', text: `${m.uploadedBy || 'Someone'} upload meme`, caption: m.caption, time: m.createdAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);
  return res.json(activities);
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────

router.get("/profile/:username", async (req, res) => {
  const username = req.params.username;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  const [member] = await db.select().from(membersTable).where(eq(membersTable.name, username));
  const [mood] = await db.select().from(moodsTable).where(eq(moodsTable.username, username));
  const [birthday] = await db.select().from(birthdaysTable).where(eq(birthdaysTable.username, username));
  const myPhotos = await db.select().from(photosTable).where(eq(photosTable.uploadedBy, username));
  const myShoutoutsReceived = await db.select().from(shoutoutsTable).where(eq(shoutoutsTable.toUsername, username));
  const myStories = await db.select().from(storiesTable).where(eq(storiesTable.username, username));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    member: member || null,
    mood: mood || null,
    birthday: birthday || null,
    photoCount: myPhotos.length,
    shoutoutsReceived: myShoutoutsReceived.slice(0, 5),
    activeStory: myStories[0] || null,
  });
});

export default router;
