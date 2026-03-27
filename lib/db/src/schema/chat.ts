import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const chatMessagesTable = pgTable("um_chat_messages", {
  id: serial("id").primaryKey(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  replyToId: integer("reply_to_id"),
  replyToContent: text("reply_to_content"),
  isSticker: boolean("is_sticker").default(false),
  stickerCode: text("sticker_code"),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessagesTable.$inferSelect;

export const nglMessagesTable = pgTable("um_ngl_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  recipient: text("recipient"),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NglMessage = typeof nglMessagesTable.$inferSelect;
