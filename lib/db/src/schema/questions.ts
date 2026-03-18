import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  totalAttempts: integer("total_attempts").notNull().default(0),
  correctAttempts: integer("correct_attempts").notNull().default(0),
  hasWrongAttempt: boolean("has_wrong_attempt").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({
  id: true,
  totalAttempts: true,
  correctAttempts: true,
  hasWrongAttempt: true,
  createdAt: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
