import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const SUBDIRS = ["photos", "videos", "avatars", "audio", "stickers"];
SUBDIRS.forEach(d => {
  const p = path.join(UPLOAD_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

function detectSubdir(mimetype: string, typeHint?: string): string {
  if (typeHint === "avatar") return "avatars";
  if (typeHint === "sticker") return "stickers";
  if (typeHint === "audio" || mimetype.startsWith("audio/")) return "audio";
  if (typeHint === "video" || mimetype.startsWith("video/")) return "videos";
  return "photos";
}

const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = detectSubdir(file.mimetype, (req as any).body?.type);
    cb(null, path.join(UPLOAD_DIR, subdir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const generalUpload = multer({ storage: generalStorage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post("/", generalUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const subdir = detectSubdir(req.file.mimetype, req.body?.type);
  res.json({ url: `/uploads/${subdir}/${req.file.filename}` });
});

function makeStorage(subdir: string) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_DIR, subdir)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
}

router.post("/photo", multer({ storage: makeStorage("photos"), limits: { fileSize: 20 * 1024 * 1024 } }).single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/photos/${req.file.filename}` });
});

router.post("/video", multer({ storage: makeStorage("videos"), limits: { fileSize: 200 * 1024 * 1024 } }).single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/videos/${req.file.filename}` });
});

router.post("/avatar", multer({ storage: makeStorage("avatars"), limits: { fileSize: 5 * 1024 * 1024 } }).single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

router.post("/audio", multer({ storage: makeStorage("audio"), limits: { fileSize: 50 * 1024 * 1024 } }).single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/audio/${req.file.filename}` });
});

router.post("/sticker", multer({ storage: makeStorage("stickers"), limits: { fileSize: 5 * 1024 * 1024 } }).single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/stickers/${req.file.filename}` });
});

export default router;
