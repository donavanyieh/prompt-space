import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const DOMAINS = [
  "Engineering",
  "Marketing",
  "Sales",
  "Customer Support",
  "Product",
  "Design",
  "HR",
  "Finance",
  "Legal",
  "Operations",
] as const;

export const TASKS = [
  "Content Writing",
  "Code Generation",
  "Data Analysis",
  "Email Drafting",
  "Research",
  "Summarization",
  "Translation",
  "Brainstorming",
  "Documentation",
  "Review & Feedback",
] as const;

export type Domain = (typeof DOMAINS)[number];
export type Task = (typeof TASKS)[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const prompts = pgTable("prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  domain: text("domain").notNull(),
  task: text("task").notNull(),
  notes: text("notes"),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
