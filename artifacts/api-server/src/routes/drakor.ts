import { Router } from "express";
import { db } from "@workspace/db";
import { drakorTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const list = await db.select().from(drakorTable).orderBy(desc(drakorTable.updatedAt));
  return res.json(list);
});

router.get("/:memberName", async (req, res) => {
  const [row] = await db.select().from(drakorTable).where(eq(drakorTable.memberName, req.params.memberName));
  return res.json(row || null);
});

router.post("/", async (req, res) => {
  const { memberName, drama } = req.body;
  if (!memberName || !drama?.title) return res.status(400).json({ error: "memberName and drama.title required" });

  const [existing] = await db.select().from(drakorTable).where(eq(drakorTable.memberName, memberName));
  const newDrama = {
    title: drama.title,
    year: drama.year || "",
    genre: drama.genre || "",
    rating: drama.rating || 0,
    poster: drama.poster || "",
    notes: drama.notes || "",
    watched: drama.watched || false,
    addedAt: new Date().toISOString(),
  };

  if (existing) {
    const dramas = [...(existing.dramas as any[]), newDrama];
    const [updated] = await db.update(drakorTable).set({ dramas, updatedAt: new Date() }).where(eq(drakorTable.memberName, memberName)).returning();
    return res.json(updated);
  } else {
    const [created] = await db.insert(drakorTable).values({ memberName, dramas: [newDrama] }).returning();
    return res.json(created);
  }
});

// PATCH toggle watched status for a drama by index
router.patch("/:memberName/drama/:idx/watched", async (req, res) => {
  const { memberName } = req.params;
  const idx = parseInt(req.params.idx);
  const [row] = await db.select().from(drakorTable).where(eq(drakorTable.memberName, memberName));
  if (!row) return res.status(404).json({ error: "Not found" });
  const dramas = (row.dramas as any[]).map((d: any, i: number) =>
    i === idx ? { ...d, watched: !d.watched } : d
  );
  const [updated] = await db.update(drakorTable).set({ dramas, updatedAt: new Date() }).where(eq(drakorTable.memberName, memberName)).returning();
  return res.json(updated);
});

// DELETE one drama by index
router.delete("/:memberName/drama/:idx", async (req, res) => {
  const { memberName } = req.params;
  const idx = parseInt(req.params.idx);
  const [row] = await db.select().from(drakorTable).where(eq(drakorTable.memberName, memberName));
  if (!row) return res.status(404).json({ error: "Not found" });
  const dramas = (row.dramas as any[]).filter((_: any, i: number) => i !== idx);
  const [updated] = await db.update(drakorTable).set({ dramas, updatedAt: new Date() }).where(eq(drakorTable.memberName, memberName)).returning();
  return res.json(updated);
});

export default router;
