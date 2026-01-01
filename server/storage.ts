import { 
  prompts, comments, teams, teamMembers,
  type Prompt, type InsertPrompt, 
  type Comment, type InsertComment,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, inArray, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByJoinCode(joinCode: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getUserTeams(userId: string): Promise<Team[]>;
  
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  isUserInTeam(userId: string, teamId: string): Promise<boolean>;
  getUserTeamId(userId: string): Promise<string | null>;
  
  getPrompts(teamId: string, options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  
  getComments(promptId: string): Promise<Comment[]>;
  getCommentCount(promptId: string): Promise<number>;
  createComment(comment: InsertComment): Promise<Comment>;
}

function generateJoinCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export class DatabaseStorage implements IStorage {
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
    
    await this.addTeamMember({ teamId: team.id, userId: insertTeam.leaderId });
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    if (memberships.length === 0) return [];
    
    const teamIds = memberships.map(m => m.teamId);
    return await db.select().from(teams).where(inArray(teams.id, teamIds));
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
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

  async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const [member] = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
    return !!member;
  }

  async getUserTeamId(userId: string): Promise<string | null> {
    const [membership] = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return membership?.teamId || null;
  }

  async getPrompts(teamId: string, options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]> {
    let query = db.select().from(prompts).where(eq(prompts.teamId, teamId));
    
    const results = await query.orderBy(desc(prompts.createdAt));
    
    let filtered = results;
    
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
    
    if (options?.domains && options.domains.length > 0) {
      filtered = filtered.filter((p) => options.domains!.includes(p.domain));
    }
    
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
}

export const storage = new DatabaseStorage();
