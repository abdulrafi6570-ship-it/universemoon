import { Router } from "express";
import multer from "multer";
import { uploadBufferToR2, createPresignedUpload } from "../lib/r2";

const router = Router();

// For big files (video especially), the browser asks here for a one-time
// signed URL, then PUTs the file bytes straight to R2 itself — the file
// never passes through this Vercel function, sidestepping its ~4.5MB
// request body limit.
router.post("/presign", async (req, res) => {
  const { filename, contentType, type } = req.body || {};
  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType are required" });
  }
  const subdir = type === "video" ? "videos" : type === "audio" ? "audio" : "photos";
  try {
    const { uploadUrl, publicUrl } = await createPresignedUpload(subdir, filename, contentType);
    res.json({ uploadUrl, url: publicUrl });
  } catch (err) {
    req.log?.error({ err }, "Failed to create presigned upload URL");
    res.status(502).json({ error: "Could not prepare upload" });
  }
});

// Files are buffered in memory, then streamed to Cloudflare R2 — no local disk
// writes, since the backend's filesystem is ephemeral in production.
const memoryUpload = multer({ storage: multer.memoryStorage() });

function detectSubdir(mimetype: string, typeHint?: string): string {
  if (typeHint === "avatar") return "avatars";
  if (typeHint === "sticker") return "stickers";
  if (typeHint === "audio" || mimetype.startsWith("audio/")) return "audio";
  if (typeHint === "video" || mimetype.startsWith("video/")) return "videos";
  return "photos";
}

const LIMITS: Record<string, number> = {
  photos: 20 * 1024 * 1024,
  videos: 200 * 1024 * 1024,
  avatars: 5 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  stickers: 5 * 1024 * 1024,
};

router.post("/", memoryUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const subdir = detectSubdir(req.file.mimetype, req.body?.type);
  if (req.file.size > LIMITS[subdir]) {
    return res.status(413).json({ error: "File too large" });
  }
  try {
    const { url } = await uploadBufferToR2(subdir, req.file);
    res.json({ url });
  } catch (err) {
    req.log?.error({ err }, "R2 upload failed");
    res.status(502).json({ error: "Upload to storage failed" });
  }
});

function makeRoute(subdir: string) {
  return async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    try {
      const { url } = await uploadBufferToR2(subdir, req.file);
      res.json({ url });
    } catch (err) {
      req.log?.error({ err }, "R2 upload failed");
      res.status(502).json({ error: "Upload to storage failed" });
    }
  };
}

router.post("/photo", multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.photos } }).single("file"), makeRoute("photos"));
router.post("/video", multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.videos } }).single("file"), makeRoute("videos"));
router.post("/avatar", multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.avatars } }).single("file"), makeRoute("avatars"));
router.post("/audio", multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.audio } }).single("file"), makeRoute("audio"));
router.post("/sticker", multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.stickers } }).single("file"), makeRoute("stickers"));

export default router;
