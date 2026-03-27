import { pgTable, serial, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const photosTable = pgTable("um_photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption"),
  uploadedBy: text("uploaded_by"),
  category: text("category").default("random"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoriesTable = pgTable("um_memories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date"),
  addedBy: text("added_by"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const linksTable = pgTable("um_links", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  desc: text("desc"),
  category: text("category").default("Lainnya"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const musicTable = pgTable("um_music", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  url: text("url"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const secretsTable = pgTable("um_secrets", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  revealDate: text("reveal_date"),
  locked: boolean("locked").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opMemTable = pgTable("um_opmem", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  openDate: text("open_date"),
  closeDate: text("close_date"),
  isOpen: boolean("is_open").default(true),
  acceptedMembers: jsonb("accepted_members").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mepTable = pgTable("um_mep", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  participants: jsonb("participants").default([]),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votesTable = pgTable("um_votes", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  username: text("username").notNull(),
  option: text("option").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameStatesTable = pgTable("um_game_states", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull(),
  status: text("status").notNull().default("lobby"),
  players: jsonb("players").default([]),
  phase: text("phase").default("lobby"),
  round: integer("round").default(0),
  winner: text("winner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reactionsTable = pgTable("um_reactions", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  emoji: text("emoji").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Photo = typeof photosTable.$inferSelect;
export type Memory = typeof memoriesTable.$inferSelect;
export type Link = typeof linksTable.$inferSelect;
export type Track = typeof musicTable.$inferSelect;
export type Secret = typeof secretsTable.$inferSelect;
export type OpMem = typeof opMemTable.$inferSelect;
export type Mep = typeof mepTable.$inferSelect;
export type Vote = typeof votesTable.$inferSelect;
export type GameState = typeof gameStatesTable.$inferSelect;
export type Reaction = typeof reactionsTable.$inferSelect;
