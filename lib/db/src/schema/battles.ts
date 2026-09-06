import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const battlesTable = pgTable("um_battles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  isTeam: boolean("is_team").notNull().default(false),
  status: text("status").notNull().default("ongoing"), // ongoing | finished
  thirdPlace: text("third_place"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const battleMatchesTable = pgTable("um_battle_matches", {
  id: serial("id").primaryKey(),
  battleId: integer("battle_id").notNull(),
  round: integer("round").notNull(),
  matchIndex: integer("match_index").notNull(),
  name1: text("name1"),
  name2: text("name2"),
  winnerName: text("winner_name"),
  // Raw footage each side submits — visible/downloadable by admin only.
  submission1Url: text("submission1_url"),
  submission2Url: text("submission2_url"),
  // The official recap/preview video an admin uploads afterward — visible to everyone.
  resultVideoUrl: text("result_video_url"),
});

export const insertBattleSchema = createInsertSchema(battlesTable).omit({ id: true, createdAt: true });
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
export type BattleMatch = typeof battleMatchesTable.$inferSelect;
