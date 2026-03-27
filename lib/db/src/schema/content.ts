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
  artist: text("artist"),
  url: text("url"),
  fileUrl: text("file_url"),
  genre: text("genre"),
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
  targetCount: integer("target_count").default(50),
  tiktokLink: text("tiktok_link"),
  requirements: text("requirements"),
  acceptedMembers: jsonb("accepted_members").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mepTable = pgTable("um_mep", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  fileUrl: text("file_url"),
  eventDate: text("event_date"),
  participants: jsonb("participants").default([]),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nglReactionsTable = pgTable("um_ngl_reactions", {
  id: serial("id").primaryKey(),
  nglId: integer("ngl_id").notNull(),
  username: text("username").notNull(),
  emoji: text("emoji").notNull(),
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

export const chatDmsTable = pgTable("um_chat_dms", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username"),
  toUsername: text("to_username"),
  content: text("content"),
  stickerUrl: text("sticker_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stickersTable = pgTable("um_stickers", {
  id: serial("id").primaryKey(),
  name: text("name"),
  fileUrl: text("file_url"),
  category: text("category").default("general"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameRoomsTable = pgTable("um_game_rooms", {
  id: serial("id").primaryKey(),
  code: text("code"),
  gameType: text("game_type"),
  hostUsername: text("host_username"),
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

export const gameStatesTable = pgTable("um_game_states", {
  id: serial("id").primaryKey(),
  gameType: text("game_type"),
  status: text("status").default("lobby"),
  players: jsonb("players").default([]),
  phase: text("phase").default("lobby"),
  round: integer("round").default(0),
  winner: text("winner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameLeaderboardTable = pgTable("um_game_leaderboard", {
  id: serial("id").primaryKey(),
  username: text("username"),
  gameType: text("game_type"),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  gamesPlayed: integer("games_played").default(0),
  xpEarned: integer("xp_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reactionsTable = pgTable("um_reactions", {
  id: serial("id").primaryKey(),
  contentType: text("content_type"),
  contentId: integer("content_id"),
  emoji: text("emoji"),
  username: text("username"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votesTable = pgTable("um_votes", {
  id: serial("id").primaryKey(),
  topic: text("topic"),
  username: text("username"),
  option: text("option"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollsTable = pgTable("um_polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").notNull().default([]),
  comments: jsonb("comments").notNull().default([]),
  createdBy: text("created_by"),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drakorTable = pgTable("um_drakor", {
  id: serial("id").primaryKey(),
  memberName: text("member_name").notNull(),
  dramas: jsonb("dramas").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
