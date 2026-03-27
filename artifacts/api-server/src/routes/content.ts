import { Router } from "express";
import { db } from "@workspace/db";
import {
  photosTable, memoriesTable, linksTable, musicTable, secretsTable, opMemTable, mepTable
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// PHOTOS
router.get("/photos", async (req, res) => {
  const category = req.query.category as string;
  let photos;
  if (category && category !== "all") {
    photos = await db.select().from(photosTable).where(eq(photosTable.category, category)).orderBy(desc(photosTable.createdAt));
  } else {
    photos = await db.select().from(photosTable).orderBy(desc(photosTable.createdAt));
  }
  return res.json(photos);
});

router.post("/photos", async (req, res) => {
  const { url, fileUrl, caption, uploadedBy, category } = req.body;
  if (!url && !fileUrl) return res.status(400).json({ error: "URL or fileUrl required" });
  const [photo] = await db.insert(photosTable).values({
    url: url || null, fileUrl: fileUrl || null,
    caption, uploadedBy, category: category || "random"
  }).returning();
  return res.json(photo);
});

router.delete("/photos/:id", async (req, res) => {
  await db.delete(photosTable).where(eq(photosTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// MEMORIES
router.get("/memories", async (req, res) => {
  const memories = await db.select().from(memoriesTable).orderBy(memoriesTable.date);
  return res.json(memories);
});

router.post("/memories", async (req, res) => {
  const { title, content, date, addedBy, photo } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content required" });
  const [memory] = await db.insert(memoriesTable).values({ title, content, date, addedBy, photo }).returning();
  return res.json(memory);
});

router.delete("/memories/:id", async (req, res) => {
  await db.delete(memoriesTable).where(eq(memoriesTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// LINKS
router.get("/links", async (req, res) => {
  const links = await db.select().from(linksTable).orderBy(linksTable.createdAt);
  return res.json(links);
});

router.post("/links", async (req, res) => {
  const { title, url, desc, category, addedBy } = req.body;
  if (!title || !url) return res.status(400).json({ error: "Title and URL required" });
  const [link] = await db.insert(linksTable).values({ title, url, desc, category: category || "Lainnya", addedBy }).returning();
  return res.json(link);
});

router.delete("/links/:id", async (req, res) => {
  await db.delete(linksTable).where(eq(linksTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// MUSIC
router.get("/music", async (req, res) => {
  const tracks = await db.select().from(musicTable).orderBy(musicTable.createdAt);
  return res.json(tracks);
});

router.post("/music", async (req, res) => {
  const { title, artist, url, fileUrl, genre, addedBy } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });
  const [track] = await db.insert(musicTable).values({
    title,
    artist: artist || null,
    url: url || null,
    fileUrl: fileUrl || null,
    genre: genre || null,
    addedBy: addedBy || null,
  }).returning();
  return res.json(track);
});

router.delete("/music/:id", async (req, res) => {
  await db.delete(musicTable).where(eq(musicTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// SECRETS / VAULT
router.get("/secrets", async (req, res) => {
  const secrets = await db.select().from(secretsTable).orderBy(secretsTable.createdAt);
  return res.json(secrets);
});

router.post("/secrets", async (req, res) => {
  const { content, revealDate } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  const [secret] = await db.insert(secretsTable).values({ content, revealDate, locked: true }).returning();
  return res.json(secret);
});

router.put("/secrets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [secret] = await db.select().from(secretsTable).where(eq(secretsTable.id, id));
  if (!secret) return res.status(404).json({ error: "Not found" });
  const [updated] = await db.update(secretsTable).set({ locked: !secret.locked }).where(eq(secretsTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/secrets/:id", async (req, res) => {
  await db.delete(secretsTable).where(eq(secretsTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// OPMEM
router.get("/opmem", async (req, res) => {
  const all = await db.select().from(opMemTable).orderBy(desc(opMemTable.createdAt));
  return res.json(all);
});

router.get("/opmem/active", async (req, res) => {
  const [opmem] = await db.select().from(opMemTable).where(eq(opMemTable.isOpen, true)).orderBy(desc(opMemTable.createdAt)).limit(1);
  return res.json(opmem || null);
});

router.post("/opmem", async (req, res) => {
  const { title, description, openDate, closeDate, isOpen, requirements } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const [opmem] = await db.insert(opMemTable).values({
    title, description, openDate, closeDate,
    isOpen: isOpen ?? true, acceptedMembers: [], requirements,
  }).returning();
  return res.json(opmem);
});

router.put("/opmem/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, openDate, closeDate, isOpen, requirements, acceptedMembers } = req.body;
  const [updated] = await db.update(opMemTable).set({
    title, description, openDate, closeDate, isOpen, requirements,
    ...(acceptedMembers !== undefined ? { acceptedMembers } : {}),
  }).where(eq(opMemTable.id, id)).returning();
  return res.json(updated);
});

router.post("/opmem/:id/accepted", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, tiktokUsername, tiktokPhotoUrl } = req.body;
  const [opmem] = await db.select().from(opMemTable).where(eq(opMemTable.id, id));
  if (!opmem) return res.status(404).json({ error: "OpMem not found" });
  const accepted = (opmem.acceptedMembers as any[]) || [];
  accepted.push({ name, tiktokUsername: tiktokUsername || null, tiktokPhotoUrl: tiktokPhotoUrl || null, addedAt: new Date().toISOString() });
  const [updated] = await db.update(opMemTable).set({ acceptedMembers: accepted }).where(eq(opMemTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/opmem/:id/accepted/:idx", async (req, res) => {
  const id = parseInt(req.params.id);
  const idx = parseInt(req.params.idx);
  const [opmem] = await db.select().from(opMemTable).where(eq(opMemTable.id, id));
  if (!opmem) return res.status(404).json({ error: "Not found" });
  const accepted = (opmem.acceptedMembers as any[]) || [];
  accepted.splice(idx, 1);
  await db.update(opMemTable).set({ acceptedMembers: accepted }).where(eq(opMemTable.id, id));
  return res.json({ success: true });
});

router.delete("/opmem/:id", async (req, res) => {
  await db.delete(opMemTable).where(eq(opMemTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

// MEP
router.get("/mep", async (req, res) => {
  const meps = await db.select().from(mepTable).orderBy(desc(mepTable.createdAt));
  return res.json(meps);
});

router.post("/mep", async (req, res) => {
  const { title, description, videoUrl, fileUrl, participants, createdBy } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const [mep] = await db.insert(mepTable).values({
    title, description,
    videoUrl: videoUrl || null, fileUrl: fileUrl || null,
    participants: participants || [], createdBy,
  }).returning();
  return res.json(mep);
});

router.put("/mep/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, videoUrl, fileUrl, participants } = req.body;
  const [updated] = await db.update(mepTable).set({ title, description, videoUrl, fileUrl, participants }).where(eq(mepTable.id, id)).returning();
  return res.json(updated);
});

router.post("/mep/:id/participant", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, photoUrl } = req.body;
  const [mep] = await db.select().from(mepTable).where(eq(mepTable.id, id));
  if (!mep) return res.status(404).json({ error: "Not found" });
  const participants = (mep.participants as any[]) || [];
  participants.push({ name, photoUrl: photoUrl || null });
  const [updated] = await db.update(mepTable).set({ participants }).where(eq(mepTable.id, id)).returning();
  return res.json(updated);
});

router.delete("/mep/:id", async (req, res) => {
  await db.delete(mepTable).where(eq(mepTable.id, parseInt(req.params.id)));
  return res.json({ success: true });
});

export default router;
