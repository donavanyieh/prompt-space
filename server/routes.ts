/**
 * API Routes
 * 
 * Defines all REST API endpoints for the application.
 * All routes (except auth) require authentication and validate team membership.
 */

import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertPromptSchema, insertCommentSchema, insertTeamSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, authStorage } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // Team Routes
  // ============================================

  // Get all teams the current user belongs to
  app.get("/api/teams/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get a specific team by ID (requires membership)
  app.get("/api/teams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const team = await storage.getTeam(req.params.id);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, team.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  // Get team members with user details (requires membership)
  app.get("/api/teams/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isMember = await storage.isUserInTeam(userId, req.params.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      const members = await storage.getTeamMembers(req.params.id);
      
      // Enrich with user profile data
      const memberDetails = await Promise.all(
        members.map(async (m) => {
          const user = await authStorage.getUser(m.userId);
          return {
            ...m,
            user: user ? { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName,
              email: user.email,
              profileImageUrl: user.profileImageUrl 
            } : null
          };
        })
      );
      res.json(memberDetails);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Create a new team (user becomes leader and first member)
  app.post("/api/teams", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTeamSchema.parse({ ...req.body, leaderId: userId });
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Join an existing team using a join code
  app.post("/api/teams/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { joinCode } = req.body;
      
      if (!joinCode) {
        return res.status(400).json({ message: "Join code is required" });
      }
      
      const team = await storage.getTeamByJoinCode(joinCode);
      if (!team) {
        return res.status(404).json({ message: "Invalid join code" });
      }
      
      await storage.addTeamMember({ teamId: team.id, userId });
      res.json(team);
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  // Leave a team (user removes themselves from the team)
  app.delete("/api/teams/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamId = req.params.id;
      
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      const team = await storage.getTeam(teamId);
      if (team?.leaderId === userId) {
        return res.status(400).json({ message: "Team leaders cannot leave their own team" });
      }
      
      await storage.removeTeamMember(teamId, userId);
      res.json({ message: "Successfully left the team" });
    } catch (error) {
      console.error("Error leaving team:", error);
      res.status(500).json({ message: "Failed to leave team" });
    }
  });

  // ============================================
  // Prompt Routes
  // ============================================

  // Get prompts for a team with optional filtering
  app.get("/api/prompts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamId = req.query.teamId as string | undefined;
      
      if (!teamId) {
        return res.json([]);
      }
      
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      // Parse filter parameters
      const search = req.query.search as string | undefined;
      const domainsParam = req.query.domains as string | undefined;
      const tasksParam = req.query.tasks as string | undefined;
      
      const domains = domainsParam ? domainsParam.split(",").filter(Boolean) : undefined;
      const tasks = tasksParam ? tasksParam.split(",").filter(Boolean) : undefined;
      
      const prompts = await storage.getPrompts(teamId, { search, domains, tasks });
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  // Get a single prompt by ID (requires team membership)
  app.get("/api/prompts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, prompt.teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view this prompt" });
      }
      
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching prompt:", error);
      res.status(500).json({ message: "Failed to fetch prompt" });
    }
  });

  // Create a new prompt (requires team membership)
  app.post("/api/prompts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      const teamId = req.body.teamId as string | undefined;
      
      if (!teamId) {
        return res.status(400).json({ message: "Team ID is required" });
      }
      
      const isMember = await storage.isUserInTeam(userId, teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this team" });
      }
      
      // Build author display name
      const authorName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.email || 'Anonymous';
      
      const validatedData = insertPromptSchema.parse({
        ...req.body,
        authorId: userId,
        authorName,
        teamId,
      });
      const prompt = await storage.createPrompt(validatedData);
      res.status(201).json(prompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating prompt:", error);
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  // ============================================
  // Comment Routes
  // ============================================

  // Get comments for a prompt (requires team membership)
  app.get("/api/prompts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, prompt.teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const comments = await storage.getComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Get comment count for a prompt
  app.get("/api/prompts/:id/comments/count", isAuthenticated, async (req: any, res) => {
    try {
      const count = await storage.getCommentCount(req.params.id);
      res.json(count);
    } catch (error) {
      console.error("Error fetching comment count:", error);
      res.status(500).json({ message: "Failed to fetch comment count" });
    }
  });

  // Add a comment to a prompt (requires team membership)
  app.post("/api/prompts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, prompt.teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const authorName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.email || 'Anonymous';

      const commentData = insertCommentSchema.omit({ promptId: true, authorId: true, authorName: true }).parse(req.body);
      const comment = await storage.createComment({
        ...commentData,
        promptId: req.params.id,
        authorId: userId,
        authorName,
      });
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // ============================================
  // Vote Routes
  // ============================================

  // Get vote counts and user's vote for a prompt
  app.get("/api/prompts/:id/votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, prompt.teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const counts = await storage.getVoteCounts(req.params.id);
      const userVote = await storage.getVote(req.params.id, userId);
      res.json({ ...counts, userVote: userVote?.value || null });
    } catch (error) {
      console.error("Error fetching votes:", error);
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });

  // Cast or toggle a vote (clicking same vote removes it)
  app.post("/api/prompts/:id/votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const isMember = await storage.isUserInTeam(userId, prompt.teamId);
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const { value } = req.body;
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ message: "Vote value must be 1 or -1" });
      }
      
      const existingVote = await storage.getVote(req.params.id, userId);
      
      // Toggle behavior: clicking same vote removes it
      if (existingVote && existingVote.value === value) {
        await storage.removeVote(req.params.id, userId);
        const counts = await storage.getVoteCounts(req.params.id);
        return res.json({ ...counts, userVote: null });
      }
      
      // Create or update vote
      await storage.upsertVote({
        promptId: req.params.id,
        userId,
        value,
      });
      
      const counts = await storage.getVoteCounts(req.params.id);
      res.json({ ...counts, userVote: value });
    } catch (error) {
      console.error("Error voting:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  return httpServer;
}
