/**
 * Database Storage Layer
 * 
 * Provides CRUD operations for all application entities.
 * All database access goes through this layer to maintain separation of concerns.
 */

import { 
  prompts, comments, teams, teamMembers, votes,
  type Prompt, type InsertPrompt, 
  type Comment, type InsertComment,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type Vote, type InsertVote
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Storage interface defining all available database operations.
 * Implementations must fulfill this contract for data persistence.
 */
export interface IStorage {
  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByJoinCode(joinCode: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getUserTeams(userId: string): Promise<Team[]>;
  
  // Team membership operations
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  isUserInTeam(userId: string, teamId: string): Promise<boolean>;
  getUserTeamId(userId: string): Promise<string | null>;
  
  // Prompt operations
  getPrompts(teamId: string, options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  
  // Comment operations
  getComments(promptId: string): Promise<Comment[]>;
  getCommentCount(promptId: string): Promise<number>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Vote operations
  getVote(promptId: string, userId: string): Promise<Vote | undefined>;
  getVoteCounts(promptId: string): Promise<{ upvotes: number; downvotes: number }>;
  upsertVote(vote: InsertVote): Promise<Vote>;
  removeVote(promptId: string, userId: string): Promise<void>;
}

/**
 * Generates an 8-character uppercase hex code for team invitations.
 */
function generateJoinCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/**
 * PostgreSQL implementation of the storage interface using Drizzle ORM.
 */
export class DatabaseStorage implements IStorage {
  
  // ============================================
  // Team Operations
  // ============================================

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamByJoinCode(joinCode: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.joinCode, joinCode.toUpperCase()));
    return team;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const joinCode = generateJoinCode();
    const [team] = await db
      .insert(teams)
      .values({ ...insertTeam, joinCode })
      .returning();
    
    // Automatically add the creator as the first team member
    await this.addTeamMember({ teamId: team.id, userId: insertTeam.leaderId });
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    if (memberships.length === 0) return [];
    
    const teamIds = memberships.map(m => m.teamId);
    return await db.select().from(teams).where(inArray(teams.id, teamIds));
  }

  // ============================================
  // Team Membership Operations
  // ============================================

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    // Check if user is already a member (prevent duplicates)
    const existing = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.teamId, member.teamId), eq(teamMembers.userId, member.userId)));
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [teamMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    return teamMember;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const [member] = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
    return !!member;
  }

  async getUserTeamId(userId: string): Promise<string | null> {
    const [membership] = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return membership?.teamId || null;
  }

  // ============================================
  // Prompt Operations
  // ============================================

  async getPrompts(teamId: string, options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]> {
    const results = await db.select()
      .from(prompts)
      .where(eq(prompts.teamId, teamId))
      .orderBy(desc(prompts.createdAt));
    
    let filtered = results;
    
    // Apply search filter (matches title, prompt content, notes, domain, or task)
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.prompt.toLowerCase().includes(searchLower) ||
        p.notes?.toLowerCase().includes(searchLower) ||
        p.domain.toLowerCase().includes(searchLower) ||
        p.task.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply domain filter
    if (options?.domains && options.domains.length > 0) {
      filtered = filtered.filter((p) => options.domains!.includes(p.domain));
    }
    
    // Apply task filter
    if (options?.tasks && options.tasks.length > 0) {
      filtered = filtered.filter((p) => options.tasks!.includes(p.task));
    }
    
    return filtered;
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt;
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const [prompt] = await db
      .insert(prompts)
      .values(insertPrompt)
      .returning();
    return prompt;
  }

  // ============================================
  // Comment Operations
  // ============================================

  async getComments(promptId: string): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.promptId, promptId))
      .orderBy(desc(comments.createdAt));
  }

  async getCommentCount(promptId: string): Promise<number> {
    const result = await db.select().from(comments).where(eq(comments.promptId, promptId));
    return result.length;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // ============================================
  // Vote Operations
  // ============================================

  async getVote(promptId: string, userId: string): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes)
      .where(and(eq(votes.promptId, promptId), eq(votes.userId, userId)));
    return vote;
  }

  async getVoteCounts(promptId: string): Promise<{ upvotes: number; downvotes: number }> {
    const allVotes = await db.select().from(votes).where(eq(votes.promptId, promptId));
    const upvotes = allVotes.filter(v => v.value === 1).length;
    const downvotes = allVotes.filter(v => v.value === -1).length;
    return { upvotes, downvotes };
  }

  async upsertVote(insertVote: InsertVote): Promise<Vote> {
    const existing = await this.getVote(insertVote.promptId, insertVote.userId);
    
    if (existing) {
      // Update existing vote
      const [updated] = await db.update(votes)
        .set({ value: insertVote.value })
        .where(eq(votes.id, existing.id))
        .returning();
      return updated;
    }
    
    // Create new vote
    const [vote] = await db.insert(votes).values(insertVote).returning();
    return vote;
  }

  async removeVote(promptId: string, userId: string): Promise<void> {
    await db.delete(votes).where(
      and(eq(votes.promptId, promptId), eq(votes.userId, userId))
    );
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
