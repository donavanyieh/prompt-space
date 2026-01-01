import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPromptSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/prompts", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const domainsParam = req.query.domains as string | undefined;
      const tasksParam = req.query.tasks as string | undefined;
      
      const domains = domainsParam ? domainsParam.split(",").filter(Boolean) : undefined;
      const tasks = tasksParam ? tasksParam.split(",").filter(Boolean) : undefined;
      
      const prompts = await storage.getPrompts({ search, domains, tasks });
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching prompt:", error);
      res.status(500).json({ message: "Failed to fetch prompt" });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      const validatedData = insertPromptSchema.parse(req.body);
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

  app.get("/api/prompts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get("/api/prompts/:id/comments/count", async (req, res) => {
    try {
      const count = await storage.getCommentCount(req.params.id);
      res.json(count);
    } catch (error) {
      console.error("Error fetching comment count:", error);
      res.status(500).json({ message: "Failed to fetch comment count" });
    }
  });

  app.post("/api/prompts/:id/comments", async (req, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }

      const commentData = insertCommentSchema.omit({ promptId: true }).parse(req.body);
      const comment = await storage.createComment({
        ...commentData,
        promptId: req.params.id,
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

  return httpServer;
}
