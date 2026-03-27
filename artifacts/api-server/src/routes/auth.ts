import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, membersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const VALID_TOKENS: Record<string, string> = {
  "ADMIN UM SECRET": "admin",
  "MEMBER UM 2026": "member",
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "um_salt_2025").digest("hex");
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/validate-token", (req, res) => {
  const { token } = req.body;
  const role = VALID_TOKENS[token];
  if (role) {
    res.json({ valid: true, role });
  } else {
    res.status(400).json({ error: "Token tidak valid" });
  }
});

router.post("/register", async (req, res) => {
  const { token, username, password, avatarUrl } = req.body;
  if (!token || !username || !password) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }
  const role = VALID_TOKENS[token];
  if (!role) {
    return res.status(400).json({ error: "Token tidak valid. Minta token dari admin via WhatsApp." });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: "Username harus 3-20 karakter" });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: "Username hanya boleh huruf, angka, dan underscore" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
  if (existing.length > 0) {
    return res.status(400).json({ error: "Username sudah dipakai" });
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    username: username.toLowerCase(),
    passwordHash,
    role,
    avatarUrl: avatarUrl || null,
    xp: 0,
    level: 1,
  }).returning();

  // Auto-create member profile
  const existingMember = await db.select().from(membersTable).where(eq(membersTable.name, username.toLowerCase()));
  if (existingMember.length === 0) {
    const memberRole = role === 'admin' ? 'Admin' : 'Member';
    await db.insert(membersTable).values({
      name: username.toLowerCase(),
      nickname: username.toLowerCase(),
      role: memberRole,
      isActive: true,
      joinDate: new Date().toISOString().split('T')[0],
      avatarUrl: avatarUrl || null,
    });
  }

  return res.json({ success: true, message: "Registrasi berhasil! Silakan login." });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase()));
  if (!user) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Akun kamu telah dibanned. Hubungi admin." });
  }

  const now = new Date();
  if (user.lockUntil && user.lockUntil > now) {
    const minutes = Math.ceil((user.lockUntil.getTime() - now.getTime()) / 60000);
    return res.status(429).json({ error: `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.` });
  }

  const passwordHash = hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    const attempts = (user.loginAttempts || 0) + 1;
    let lockUntil = null;
    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 5 * 60 * 1000);
    }
    await db.update(usersTable)
      .set({ loginAttempts: attempts, lockUntil })
      .where(eq(usersTable.id, user.id));
    const remaining = 5 - attempts;
    if (remaining <= 0) {
      return res.status(401).json({ error: "Akun terkunci 5 menit karena terlalu banyak percobaan salah." });
    }
    return res.status(401).json({ error: `Username atau password salah. ${remaining} percobaan tersisa.` });
  }

  await db.update(usersTable)
    .set({ loginAttempts: 0, lockUntil: null })
    .where(eq(usersTable.id, user.id));

  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, sessionToken, expiresAt });

  // Award XP for login
  await db.update(usersTable).set({ xp: user.xp + 1 }).where(eq(usersTable.id, user.id));

  res.cookie("session_token", sessionToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.json({
    success: true,
    sessionToken,
    user: { id: user.id, username: user.username, role: user.role, avatarUrl: user.avatarUrl, xp: user.xp, level: user.level, isBanned: user.isBanned },
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, token));
  }
  res.clearCookie("session_token");
  return res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const [session] = await db.select().from(sessionsTable).where(
    and(eq(sessionsTable.sessionToken, token), gt(sessionsTable.expiresAt, new Date()))
  );
  if (!session) {
    return res.status(401).json({ error: "Session expired" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  return res.json({ id: user.id, username: user.username, role: user.role, avatarUrl: user.avatarUrl, xp: user.xp, level: user.level, isBanned: user.isBanned });
});

export default router;
