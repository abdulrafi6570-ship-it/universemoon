import { Router } from "express";
import { db } from "@workspace/db";
import { adminEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

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

export default router;
