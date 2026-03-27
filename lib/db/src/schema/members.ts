import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("um_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  role: text("role").default("Member"),
  bio: text("bio"),
  joinDate: text("join_date"),
  favoriteSong: text("favorite_song"),
  socialLinks: text("social_links"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  kickReason: text("kick_reason"),
  kickDate: text("kick_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, createdAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
