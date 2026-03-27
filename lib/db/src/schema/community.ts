import { pgTable, serial, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const storiesTable = pgTable("um_stories", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  content: text("content").notNull().default(""),
  emoji: text("emoji").default("✨"),
  color: text("color").default("#ffffff"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shoutoutsTable = pgTable("um_shoutouts", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  content: text("content").notNull(),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodsTable = pgTable("um_moods", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  mood: text("mood").notNull(),
  emoji: text("emoji").default("😊"),
  color: text("color").default("#ffffff"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const capsulesTable = pgTable("um_capsules", {
  id: serial("id").primaryKey(),
  authorUsername: text("author_username").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  revealDate: text("reveal_date").notNull(),
  isRevealed: boolean("is_revealed").default(false),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qaTable = pgTable("um_qa", {
  id: serial("id").primaryKey(),
  targetMember: text("target_member").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  isAnswered: boolean("is_answered").default(false),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlistTable = pgTable("um_playlist", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist"),
  youtubeUrl: text("youtube_url"),
  addedBy: text("added_by"),
  votes: jsonb("votes").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memesTable = pgTable("um_memes", {
  id: serial("id").primaryKey(),
  fileUrl: text("file_url").notNull(),
  caption: text("caption"),
  uploadedBy: text("uploaded_by"),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotesTable = pgTable("um_quotes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  author: text("author"),
  submittedBy: text("submitted_by"),
  date: text("date"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fanficsTable = pgTable("um_fanfics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  genre: text("genre").default("General"),
  authorUsername: text("author_username").notNull(),
  likes: jsonb("likes").default([]),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customStickersTable = pgTable("um_custom_stickers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").default("General"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const milestonesTable = pgTable("um_milestones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  icon: text("icon").default("⭐"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diaryTable = pgTable("um_diary", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  date: text("date").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diaryEntriesTable = pgTable("um_diary_entries", {
  id: serial("id").primaryKey(),
  diaryId: integer("diary_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const birthdaysTable = pgTable("um_birthdays", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  memberName: text("member_name"),
  birthDate: text("birth_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rulesTable = pgTable("um_rules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("Umum"),
  order: integer("order").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── APIPI (Sistem Keluarga) ───────────────────────────────────────────────

export const familiesTable = pgTable("um_families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").default("👨‍👩‍👧‍👦"),
  mamiUsername: text("mami_username").notNull(),
  papiUsername: text("papi_username").notNull(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familyMembersTable = pgTable("um_family_members", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  username: text("username").notNull(),
  role: text("role").notNull().default("anak"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const familyProposalsTable = pgTable("um_family_proposals", {
  id: serial("id").primaryKey(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  type: text("type").notNull().default("partner"),
  familyId: integer("family_id"),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familyWallPostsTable = pgTable("um_family_wall_posts", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
