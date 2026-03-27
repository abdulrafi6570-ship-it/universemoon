import { Router } from "express";
import { db } from "@workspace/db";
import {
  familiesTable, familyMembersTable, familyProposalsTable, familyWallPostsTable
} from "@workspace/db";
import { eq, desc, and, or, sql } from "drizzle-orm";

const router = Router();

const XP_PER_LEVEL = 100;

// ─── GET semua keluarga (leaderboard) ──────────────────────────────────────
router.get("/families", async (req, res) => {
  try {
    const families = await db.select().from(familiesTable).orderBy(desc(familiesTable.xp));
    const result = await Promise.all(families.map(async (f) => {
      const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.familyId, f.id));
      return { ...f, memberCount: members.length + 2, members };
    }));
    return res.json(result);
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── GET keluarga milik user ────────────────────────────────────────────────
router.get("/families/mine", async (req, res) => {
  const { username } = req.query as { username: string };
  if (!username) return res.status(400).json({ error: "username required" });
  try {
    const asMember = await db.select().from(familyMembersTable).where(eq(familyMembersTable.username, username));
    const asPartner = await db.select().from(familiesTable).where(
      or(eq(familiesTable.mamiUsername, username), eq(familiesTable.papiUsername, username))
    );
    if (asPartner.length > 0) {
      const f = asPartner[0];
      const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.familyId, f.id));
      const wall = await db.select().from(familyWallPostsTable).where(eq(familyWallPostsTable.familyId, f.id)).orderBy(desc(familyWallPostsTable.createdAt));
      return res.json({ family: f, role: f.mamiUsername === username ? "mami" : "papi", members, wall });
    }
    if (asMember.length > 0) {
      const m = asMember[0];
      const f = await db.select().from(familiesTable).where(eq(familiesTable.id, m.familyId));
      if (!f[0]) return res.json(null);
      const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.familyId, f[0].id));
      const wall = await db.select().from(familyWallPostsTable).where(eq(familyWallPostsTable.familyId, f[0].id)).orderBy(desc(familyWallPostsTable.createdAt));
      return res.json({ family: f[0], role: "anak", members, wall });
    }
    return res.json(null);
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── GET detail keluarga by id ─────────────────────────────────────────────
router.get("/families/:id", async (req, res) => {
  try {
    const [family] = await db.select().from(familiesTable).where(eq(familiesTable.id, parseInt(req.params.id)));
    if (!family) return res.status(404).json({ error: "Not found" });
    const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.familyId, family.id));
    const wall = await db.select().from(familyWallPostsTable).where(eq(familyWallPostsTable.familyId, family.id)).orderBy(desc(familyWallPostsTable.createdAt));
    return res.json({ family, members, wall });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── PROPOSAL: kirim lamaran ────────────────────────────────────────────────
router.post("/proposals", async (req, res) => {
  const { fromUsername, toUsername, type, familyId, message } = req.body;
  if (!fromUsername || !toUsername || !type) return res.status(400).json({ error: "Missing fields" });
  try {
    // Cek apakah sudah ada pending proposal yang sama
    const existing = await db.select().from(familyProposalsTable).where(
      and(
        eq(familyProposalsTable.fromUsername, fromUsername),
        eq(familyProposalsTable.toUsername, toUsername),
        eq(familyProposalsTable.status, "pending")
      )
    );
    if (existing.length > 0) return res.status(400).json({ error: "Sudah ada lamaran yang menunggu" });

    const [proposal] = await db.insert(familyProposalsTable).values({
      fromUsername, toUsername, type, familyId: familyId || null, message: message || null, status: "pending"
    }).returning();
    return res.json(proposal);
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── GET proposals masuk untuk user ────────────────────────────────────────
router.get("/proposals", async (req, res) => {
  const { username } = req.query as { username: string };
  if (!username) return res.status(400).json({ error: "username required" });
  try {
    const incoming = await db.select().from(familyProposalsTable).where(
      and(eq(familyProposalsTable.toUsername, username), eq(familyProposalsTable.status, "pending"))
    ).orderBy(desc(familyProposalsTable.createdAt));
    const outgoing = await db.select().from(familyProposalsTable).where(
      and(eq(familyProposalsTable.fromUsername, username), eq(familyProposalsTable.status, "pending"))
    ).orderBy(desc(familyProposalsTable.createdAt));
    return res.json({ incoming, outgoing });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── TERIMA / TOLAK proposal ────────────────────────────────────────────────
router.put("/proposals/:id", async (req, res) => {
  const { action, familyName, familyEmoji } = req.body;
  const id = parseInt(req.params.id);
  try {
    const [proposal] = await db.select().from(familyProposalsTable).where(eq(familyProposalsTable.id, id));
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    if (action === "reject") {
      await db.update(familyProposalsTable).set({ status: "rejected" }).where(eq(familyProposalsTable.id, id));
      return res.json({ success: true, action: "rejected" });
    }

    if (action === "accept") {
      if (proposal.type === "partner") {
        // Buat keluarga baru
        const name = familyName || `Keluarga ${proposal.fromUsername} & ${proposal.toUsername}`;
        const emoji = familyEmoji || "👨‍👩‍👧‍👦";
        // Tentukan siapa mami dan papi — yang ngirim jadi papi, yang nerima jadi mami
        const [family] = await db.insert(familiesTable).values({
          name, emoji,
          mamiUsername: proposal.toUsername,
          papiUsername: proposal.fromUsername,
          level: 1, xp: 0,
        }).returning();
        // Tambahkan keduanya sebagai partner di family_members juga (optional, tapi konsisten)
        await db.insert(familyMembersTable).values([
          { familyId: family.id, username: proposal.toUsername, role: "mami" },
          { familyId: family.id, username: proposal.fromUsername, role: "papi" },
        ]);
        await db.update(familyProposalsTable).set({ status: "accepted" }).where(eq(familyProposalsTable.id, id));
        return res.json({ success: true, action: "accepted", family });
      }

      if (proposal.type === "adopt" && proposal.familyId) {
        // Tambahkan sebagai anak
        await db.insert(familyMembersTable).values({
          familyId: proposal.familyId, username: proposal.toUsername, role: "anak"
        });
        // Kasih XP ke keluarga
        await db.update(familiesTable).set({
          xp: sql`xp + 20`
        }).where(eq(familiesTable.id, proposal.familyId));
        await db.update(familyProposalsTable).set({ status: "accepted" }).where(eq(familyProposalsTable.id, id));

        // Cek level up
        const [fam] = await db.select().from(familiesTable).where(eq(familiesTable.id, proposal.familyId));
        if (fam && fam.xp >= fam.level * XP_PER_LEVEL) {
          await db.update(familiesTable).set({ level: fam.level + 1 }).where(eq(familiesTable.id, fam.id));
        }
        return res.json({ success: true, action: "accepted" });
      }
    }
    return res.status(400).json({ error: "Invalid action or type" });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── POST ke Family Wall ────────────────────────────────────────────────────
router.post("/families/:id/wall", async (req, res) => {
  const { username, content, imageUrl } = req.body;
  const familyId = parseInt(req.params.id);
  if (!username || !content) return res.status(400).json({ error: "Missing fields" });
  try {
    const [post] = await db.insert(familyWallPostsTable).values({
      familyId, username, content, imageUrl: imageUrl || null, reactions: {}
    }).returning();
    // Tambah XP keluarga setiap post
    await db.update(familiesTable).set({ xp: sql`xp + 5` }).where(eq(familiesTable.id, familyId));
    const [fam] = await db.select().from(familiesTable).where(eq(familiesTable.id, familyId));
    if (fam && fam.xp >= fam.level * XP_PER_LEVEL) {
      await db.update(familiesTable).set({ level: fam.level + 1 }).where(eq(familiesTable.id, familyId));
    }
    return res.json(post);
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── REACT ke wall post ─────────────────────────────────────────────────────
router.post("/families/:id/wall/:postId/react", async (req, res) => {
  const { username, emoji } = req.body;
  const postId = parseInt(req.params.postId);
  try {
    const [post] = await db.select().from(familyWallPostsTable).where(eq(familyWallPostsTable.id, postId));
    if (!post) return res.status(404).json({ error: "Post not found" });
    const reactions = (post.reactions as Record<string, string[]>) || {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(username)) {
      reactions[emoji] = reactions[emoji].filter((u: string) => u !== username);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(username);
    }
    await db.update(familyWallPostsTable).set({ reactions }).where(eq(familyWallPostsTable.id, postId));
    return res.json({ success: true, reactions });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── DELETE wall post ───────────────────────────────────────────────────────
router.delete("/families/:id/wall/:postId", async (req, res) => {
  try {
    await db.delete(familyWallPostsTable).where(eq(familyWallPostsTable.id, parseInt(req.params.postId)));
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── LEAVE family (anak kabur) ──────────────────────────────────────────────
router.delete("/families/:id/members/:username", async (req, res) => {
  const { username } = req.params;
  const familyId = parseInt(req.params.id);
  try {
    await db.delete(familyMembersTable).where(
      and(eq(familyMembersTable.familyId, familyId), eq(familyMembersTable.username, username))
    );
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

// ─── DISSOLVE keluarga (berpisah / admin) ──────────────────────────────────
router.delete("/families/:id", async (req, res) => {
  const familyId = parseInt(req.params.id);
  try {
    await db.delete(familyWallPostsTable).where(eq(familyWallPostsTable.familyId, familyId));
    await db.delete(familyMembersTable).where(eq(familyMembersTable.familyId, familyId));
    await db.delete(familiesTable).where(eq(familiesTable.id, familyId));
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
});

export default router;
