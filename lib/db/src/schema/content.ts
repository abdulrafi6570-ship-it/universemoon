import { pgTable, serial, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const photosTable = pgTable("um_photos", {
  id: serial("id").primaryKey(),
  url: text("url"),
  fileUrl: text("file_url"),
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
  fileUrl: text("file_url"),
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
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mepTable = pgTable("um_mep", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  fileUrl: text("file_url"),
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

export const gameRoomsTable = pgTable("um_game_rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  gameType: text("game_type").notNull(),
  hostUsername: text("host_username").notNull(),
  status: text("status").default("lobby"),
  category: text("category"),
  players: jsonb("players").default([]),
  phase: text("phase").default("lobby"),
  round: integer("round").default(0),
  clueOrder: jsonb("clue_order").default([]),
  currentClueIdx: integer("current_clue_idx").default(0),
  clues: jsonb("clues").default([]),
  votes: jsonb("votes").default([]),
  winner: text("winner"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reactionsTable = pgTable("um_reactions", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  emoji: text("emoji").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatReactionsTable = pgTable("um_chat_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  emoji: text("emoji").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRepliesTable = pgTable("um_chat_replies", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatDmsTable = pgTable("um_chat_dms", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  content: text("content").notNull(),
  stickerUrl: text("sticker_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stickersTable = pgTable("um_stickers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  category: text("category").default("general"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nglReactionsTable = pgTable("um_ngl_reactions", {
  id: serial("id").primaryKey(),
  nglId: integer("ngl_id").notNull(),
  emoji: text("emoji").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nglCommentsTable = pgTable("um_ngl_comments", {
  id: serial("id").primaryKey(),
  nglId: integer("ngl_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminEventsTable = pgTable("um_admin_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  triggeredBy: text("triggered_by").notNull(),
  message: text("message"),
  duration: integer("duration").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameLeaderboardTable = pgTable("um_game_leaderboard", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  gameType: text("game_type").notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  gamesPlayed: integer("games_played").default(0),
  xpEarned: integer("xp_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type GameRoom = typeof gameRoomsTable.$inferSelect;
export type Reaction = typeof reactionsTable.$inferSelect;
export type ChatReaction = typeof chatReactionsTable.$inferSelect;
export type ChatDm = typeof chatDmsTable.$inferSelect;
export type Sticker = typeof stickersTable.$inferSelect;
export type AdminEvent = typeof adminEventsTable.$inferSelect;
export type GameLeaderboard = typeof gameLeaderboardTable.$inferSelect;
