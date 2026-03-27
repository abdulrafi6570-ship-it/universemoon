import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const dirs = ["photos", "videos", "avatars", "audio", "stickers"];
dirs.forEach(d => {
  const p = path.join(UPLOAD_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
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

const photoUpload = multer({ storage: makeStorage("photos"), limits: { fileSize: 20 * 1024 * 1024 } });
const videoUpload = multer({ storage: makeStorage("videos"), limits: { fileSize: 200 * 1024 * 1024 } });
const avatarUpload = multer({ storage: makeStorage("avatars"), limits: { fileSize: 5 * 1024 * 1024 } });
const audioUpload = multer({ storage: makeStorage("audio"), limits: { fileSize: 50 * 1024 * 1024 } });
const stickerUpload = multer({ storage: makeStorage("stickers"), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/photo", photoUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/photos/${req.file.filename}` });
});

router.post("/video", videoUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/videos/${req.file.filename}` });
});

router.post("/avatar", avatarUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/avatars/${req.file.filename}` });
});

router.post("/audio", audioUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/audio/${req.file.filename}` });
});

router.post("/sticker", stickerUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/stickers/${req.file.filename}` });
});

export default router;
