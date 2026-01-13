/**
 * API Routes
 * 
 * Defines all REST API endpoints for the application.
 * All routes (except auth) require authentication and validate team membership.
 */

import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertPromptSchema, insertCommentSchema, insertTeamSchema, updatePromptSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, authStorage } from "./auth";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // Prompt Crafter Routes (Public)
  // ============================================

  // Optimize prompt using OpenAI
  app.post("/api/prompt-crafter/optimize", async (req, res) => {
    try {
      const { mode, task, purpose, outputFormat, styleTone, existingPrompt } = req.body;

      if (!mode || (mode !== "build" && mode !== "paste")) {
        return res.status(400).json({ message: "Invalid mode" });
      }

      let systemPrompt: string;
      let userPrompt: string;

      if (mode === "build") {
        // Validate required fields for build mode
        if (!task || !purpose || !outputFormat || !styleTone) {
          return res.status(400).json({ message: "All fields are required for build mode" });
        }

        systemPrompt = `You are an expert prompt engineer. Your task is to create an optimized AI prompt based on user requirements and provide a detailed explanation of the changes and enhancements made.

Return your response in the following JSON format:
{
  "optimizedPrompt": "the complete optimized prompt text",
  "changesMade": [
    {
      "type": "added" | "improved" | "structured" | "clarified",
      "description": "detailed explanation of what was added/improved/structured/clarified"
    }
  ]
}

Guidelines for creating the optimized prompt:
1. Structure the prompt clearly with sections if needed
2. Include specific instructions and constraints
3. Define the expected output format explicitly
4. Add context that helps the AI understand the task better
5. Use clear, unambiguous language
6. Use markdown to seperate key sections in the prompt if applicable
7. Include examples if appropriate
8. Specify the tone and style requirements

For changesMade, explain each enhancement you made and why it improves the prompt. Keep it to one sentence per enhancement, so that the end user may know in a single glance what improvements were made`;

        userPrompt = `Create an optimized AI prompt based on these requirements:

Task Description: ${task}

Purpose/Context: ${purpose}

Desired Output Format: ${outputFormat}

Style & Tone: ${styleTone}

Please create a well-structured, effective prompt and explain all the enhancements you made.`;

      } else {
        // Paste mode
        if (!existingPrompt) {
          return res.status(400).json({ message: "Existing prompt is required" });
        }

        systemPrompt = `You are an expert prompt engineer. Your task is to analyze and optimize existing AI prompts, then provide a detailed explanation of the improvements made.

Return your response in the following JSON format:
{
  "optimizedPrompt": "the improved prompt text",
  "changesMade": [
    {
      "type": "added" | "improved" | "structured" | "clarified" | "removed",
      "description": "detailed explanation of what was changed and why"
    }
  ]
}

Guidelines for optimization:
1. Improve clarity and specificity
2. Add structure (sections, numbered steps) if needed
3. Make instructions more explicit
4. Remove ambiguity or redundancy
5. Enhance context and constraints
6. Specify output format more clearly
7. Use markdown tags to seperate key sections in the prompt if applicable
8. Add helpful examples if missing
9. Improve tone/style consistency

For changesMade, explain each enhancement you made and why it improves the prompt. Keep it to one sentence per enhancement, so that the end user may know in a single glance what improvements were made
`;

        userPrompt = `Analyze and optimize this existing prompt:

${existingPrompt}

Please provide an improved version and explain all the changes you made to enhance its effectiveness.`;
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(responseText);

      // Validate response structure
      if (!result.optimizedPrompt || !result.changesMade) {
        throw new Error("Invalid response format from OpenAI");
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error optimizing prompt:", error);
      
      // Handle specific OpenAI errors
      if (error?.status === 401) {
        return res.status(500).json({ message: "OpenAI API key is invalid" });
      }
      if (error?.status === 429) {
        return res.status(429).json({ message: "Rate limit exceeded. Please try again later." });
      }
      
      res.status(500).json({ 
        message: error.message || "Failed to optimize prompt. Please try again." 
      });
    }
  });
  
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

  // Delete a team (leader only, cascade deletes all prompts, comments, votes, memberships)
  app.delete("/api/teams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamId = req.params.id;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.leaderId !== userId) {
        return res.status(403).json({ message: "Only the team leader can delete this team" });
      }
      
      await storage.deleteTeamWithCascade(teamId);
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Remove a member from a team (leader only, cascade deletes all their data)
  app.delete("/api/teams/:teamId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { teamId, userId: targetUserId } = req.params;
      
      // Verify requester is the team leader
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.leaderId !== currentUserId) {
        return res.status(403).json({ message: "Only the team leader can remove members" });
      }
      
      // Cannot remove yourself (the leader)
      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "Cannot remove yourself as the team leader" });
      }
      
      // Verify target is a member
      const isMember = await storage.isUserInTeam(targetUserId, teamId);
      if (!isMember) {
        return res.status(404).json({ message: "User is not a member of this team" });
      }
      
      // Remove with cascade (deletes prompts, comments, votes)
      await storage.removeTeamMemberWithCascade(teamId, targetUserId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
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
      const sortParam = req.query.sort as string | undefined;
      
      const domains = domainsParam ? domainsParam.split(",").filter(Boolean) : undefined;
      const tasks = tasksParam ? tasksParam.split(",").filter(Boolean) : undefined;
      const sort = (sortParam === 'comments' || sortParam === 'votes') ? sortParam : 'newest';
      
      const prompts = await storage.getPrompts(teamId, { search, domains, tasks, sort });
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  // Get all prompts submitted by the current user (must be before :id route)
  app.get("/api/prompts/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamId = req.query.teamId as string | undefined;
      const prompts = await storage.getUserPrompts(userId, teamId);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching user prompts:", error);
      res.status(500).json({ message: "Failed to fetch your prompts" });
    }
  });

  // Get all prompts the current user has upvoted (liked)
  app.get("/api/prompts/liked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamId = req.query.teamId as string | undefined;
      const prompts = await storage.getUserLikedPrompts(userId, teamId);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching liked prompts:", error);
      res.status(500).json({ message: "Failed to fetch liked prompts" });
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

  // Update a prompt (only the author can update)
  app.put("/api/prompts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      if (prompt.authorId !== userId) {
        return res.status(403).json({ message: "You can only edit your own prompts" });
      }
      
      const validatedData = updatePromptSchema.parse(req.body);
      const updatedPrompt = await storage.updatePrompt(req.params.id, validatedData);
      res.json(updatedPrompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  // Delete a prompt (only the author can delete)
  // Supports query param: deleteType=latest|all (default: all)
  app.delete("/api/prompts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleteType = req.query.deleteType as string || "all";
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      if (prompt.authorId !== userId) {
        return res.status(403).json({ message: "You can only delete your own prompts" });
      }
      
      if (deleteType === "latest") {
        // Rollback to previous version (delete only latest)
        if (prompt.currentVersion <= 1) {
          return res.status(400).json({ message: "Cannot delete the only version" });
        }
        const rolledBackPrompt = await storage.rollbackPromptToVersion(req.params.id);
        return res.json({ 
          message: "Latest version deleted successfully", 
          prompt: rolledBackPrompt 
        });
      } else {
        // Delete entire prompt with all versions
        await storage.deletePrompt(req.params.id);
        return res.json({ message: "Prompt deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  // Get all versions for a prompt (requires team membership)
  app.get("/api/prompts/:id/versions", isAuthenticated, async (req: any, res) => {
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
      
      const versions = await storage.getPromptVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching prompt versions:", error);
      res.status(500).json({ message: "Failed to fetch prompt versions" });
    }
  });

  // Get a specific version of a prompt (requires team membership)
  app.get("/api/prompts/:id/versions/:version", isAuthenticated, async (req: any, res) => {
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
      
      const version = await storage.getPromptVersion(req.params.id, parseInt(req.params.version));
      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }
      
      res.json(version);
    } catch (error) {
      console.error("Error fetching prompt version:", error);
      res.status(500).json({ message: "Failed to fetch prompt version" });
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

  // Get comment count for a prompt (requires team membership)
  app.get("/api/prompts/:id/comments/count", isAuthenticated, async (req: any, res) => {
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
