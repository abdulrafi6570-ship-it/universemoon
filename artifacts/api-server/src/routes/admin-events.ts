import { Router } from "express";
import { db } from "@workspace/db";
import {
  adminEventsTable, chatMessagesTable, chatDmsTable, nglMessagesTable,
  nglReactionsTable, nglCommentsTable, photosTable, memoriesTable, musicTable,
  shoutoutsTable, moodsTable, storiesTable, capsulesTable, qaTable,
  playlistTable, memesTable, quotesTable, fanficsTable, diaryEntriesTable,
  diaryTable, milestonesTable, familiesTable, familyMembersTable,
  familyProposalsTable, familyWallPostsTable, gameRoomsTable, gameStatesTable,
  gameLeaderboardTable, reactionsTable, votesTable, pollsTable, usersTable
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

const EVENT_TYPES = [
  { type: "rain", label: "Hujan Deras 🌧️", duration: 15 },
  { type: "coin_rain", label: "Hujan Koin 🪙", duration: 10 },
  { type: "fireworks", label: "Kembang Api 🎆", duration: 12 },
  { type: "confetti", label: "Confetti Party 🎊", duration: 10 },
  { type: "meteor", label: "Hujan Meteor ☄️", duration: 8 },
  { type: "stars", label: "Bintang Jatuh ✨", duration: 10 },
  { type: "snow", label: "Salju ❄️", duration: 15 },
  { type: "hearts", label: "Hujan Hati 💕", duration: 10 },
  { type: "moon_rise", label: "Bulan Terbit 🌕", duration: 20 },
  { type: "galaxy_blast", label: "Galaxy Blast 🌌", duration: 15 },
];

router.get("/types", (req, res) => {
  res.json(EVENT_TYPES);
});

router.get("/", async (req, res) => {
  const events = await db.select().from(adminEventsTable)
    .where(eq(adminEventsTable.isActive, true))
    .orderBy(desc(adminEventsTable.createdAt))
    .limit(1);
  res.json(events[0] || null);
});

router.get("/all", async (req, res) => {
  const events = await db.select().from(adminEventsTable).orderBy(desc(adminEventsTable.createdAt)).limit(20);
  res.json(events);
});

router.post("/", async (req, res) => {
  const { type, triggeredBy, message, duration } = req.body;
  if (!type || !triggeredBy) return res.status(400).json({ error: "Missing fields" });

  // Deactivate previous events
  await db.update(adminEventsTable).set({ isActive: false });

  const eventType = EVENT_TYPES.find(e => e.type === type);
  const [event] = await db.insert(adminEventsTable).values({
    type,
    triggeredBy,
    message: message || eventType?.label || type,
    duration: duration || eventType?.duration || 10,
    isActive: true,
  }).returning();
  res.json(event);
});

router.delete("/:id", async (req, res) => {
  await db.update(adminEventsTable).set({ isActive: false }).where(eq(adminEventsTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

// ─── RESET SEMUA DATA ───────────────────────────────────────────────────────
router.post("/reset-all", async (req, res) => {
  const { confirm, adminUsername } = req.body;
  if (confirm !== "RESET") return res.status(400).json({ error: "Konfirmasi tidak valid" });
  if (!adminUsername) return res.status(400).json({ error: "adminUsername required" });

  try {
    // Hapus semua konten komunitas (urutan penting — hapus yang ada FK dulu)
    await db.delete(familyWallPostsTable);
    await db.delete(familyProposalsTable);
    await db.delete(familyMembersTable);
    await db.delete(familiesTable);
    await db.delete(nglCommentsTable);
    await db.delete(nglReactionsTable);
    await db.delete(nglMessagesTable);
    await db.delete(chatDmsTable);
    await db.delete(chatMessagesTable);
    await db.delete(photosTable);
    await db.delete(memoriesTable);
    await db.delete(musicTable);
    await db.delete(shoutoutsTable);
    await db.delete(moodsTable);
    await db.delete(storiesTable);
    await db.delete(capsulesTable);
    await db.delete(qaTable);
    await db.delete(playlistTable);
    await db.delete(memesTable);
    await db.delete(quotesTable);
    await db.delete(fanficsTable);
    await db.delete(diaryEntriesTable);
    await db.delete(diaryTable);
    await db.delete(milestonesTable);
    await db.delete(gameRoomsTable);
    await db.delete(gameStatesTable);
    await db.delete(gameLeaderboardTable);
    await db.delete(reactionsTable);
    await db.delete(votesTable);
    await db.delete(pollsTable);
    await db.delete(adminEventsTable);
    // Reset XP, level, streak semua user (tapi jangan hapus akunnya)
    await db.update(usersTable).set({ xp: 0, level: 1, streak: 0 });

    return res.json({
      success: true,
      message: "Semua data komunitas telah direset. Akun user tetap ada.",
      resetBy: adminUsername,
      resetAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
