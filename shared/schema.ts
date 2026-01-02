/**
 * Database Schema and Type Definitions
 * 
 * This file defines the PostgreSQL database schema using Drizzle ORM,
 * along with Zod validation schemas and TypeScript types for the application.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export auth models (users, sessions)
export * from "./models/auth";

// Available domains for categorizing prompts
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

// Available task types for categorizing prompts
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

// Teams table - organizations that share prompts
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  joinCode: varchar("join_code", { length: 8 }).notNull().unique(),
  leaderId: varchar("leader_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team members junction table - tracks which users belong to which teams
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Prompts table - the main content shared by team members
export const prompts = pgTable("prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  domain: text("domain").notNull(),
  task: text("task").notNull(),
  notes: text("notes"),
  modelUsed: text("model_used"),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  teamId: varchar("team_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments table - discussions on prompts
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Votes table - upvotes/downvotes on prompts
export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promptId: varchar("prompt_id").notNull(),
  userId: varchar("user_id").notNull(),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define table relationships for Drizzle ORM
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  prompts: many(prompts),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  team: one(teams, {
    fields: [prompts.teamId],
    references: [teams.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  prompt: one(prompts, {
    fields: [comments.promptId],
    references: [prompts.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  prompt: one(prompts, {
    fields: [votes.promptId],
    references: [prompts.id],
  }),
}));

// Zod validation schemas for insert operations (auto-generated fields omitted)
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  joinCode: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

// TypeScript types for database operations
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
