import { type User, type InsertUser, type Prompt, type InsertPrompt, type Comment, type InsertComment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPrompts(options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  
  getComments(promptId: string): Promise<Comment[]>;
  getCommentCount(promptId: string): Promise<number>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private prompts: Map<string, Prompt>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.prompts = new Map();
    this.comments = new Map();
    
    this.seedData();
  }

  private seedData() {
    const samplePrompts: InsertPrompt[] = [
      {
        prompt: `You are a senior software engineer. Review the following code and provide:
1. A brief summary of what the code does
2. Any potential bugs or issues
3. Performance improvements
4. Best practice recommendations

Code to review:
[paste code here]`,
        domain: "Engineering",
        task: "Review & Feedback",
        notes: "Works great for code reviews. Add the specific programming language for better context.",
        authorName: "Alex Chen",
      },
      {
        prompt: `Write a professional email responding to a customer complaint about [specific issue]. 

Requirements:
- Acknowledge their frustration
- Apologize sincerely
- Explain what happened (briefly)
- Detail the resolution steps
- Offer compensation if appropriate
- End with reassurance

Tone: Professional but empathetic`,
        domain: "Customer Support",
        task: "Email Drafting",
        notes: "Customize the compensation section based on your company policy.",
        authorName: "Sarah Johnson",
      },
      {
        prompt: `Create a compelling product description for [product name].

Product details:
- Category: [category]
- Key features: [list features]
- Target audience: [describe audience]
- Price point: [price range]

The description should be:
- 150-200 words
- SEO-optimized
- Include a compelling headline
- Highlight 3 main benefits
- End with a clear call-to-action`,
        domain: "Marketing",
        task: "Content Writing",
        notes: "Add competitor products to the context for differentiation.",
        authorName: "Michael Brown",
      },
      {
        prompt: `Analyze the following data and provide insights:

Data: [paste data or describe dataset]

Please provide:
1. Key trends and patterns
2. Statistical summary (mean, median, outliers)
3. Correlations between variables
4. Actionable recommendations
5. Visualisation suggestions

Format the response with clear sections and bullet points.`,
        domain: "Product",
        task: "Data Analysis",
        notes: "For large datasets, describe the structure and provide a sample.",
        authorName: "Emily Davis",
      },
      {
        prompt: `Summarize the following document in [X] sentences/bullet points:

Document: [paste content]

Focus on:
- Main arguments or findings
- Key data points and statistics
- Action items or recommendations
- Any deadlines or important dates

Output format: [bullet points / paragraph / executive summary]`,
        domain: "Operations",
        task: "Summarization",
        notes: "Specify the audience (executive, technical team, etc.) for better results.",
        authorName: "David Wilson",
      },
    ];

    samplePrompts.forEach((promptData, index) => {
      const id = randomUUID();
      const prompt: Prompt = {
        ...promptData,
        id,
        notes: promptData.notes || null,
        createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
      };
      this.prompts.set(id, prompt);
      
      if (index === 0) {
        const commentId = randomUUID();
        this.comments.set(commentId, {
          id: commentId,
          promptId: id,
          content: "This prompt has saved me so much time in code reviews! I added a section asking for security considerations too.",
          authorName: "Jordan Lee",
          createdAt: new Date(Date.now() - (12 * 60 * 60 * 1000)),
        });
      }
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPrompts(options?: { search?: string; domains?: string[]; tasks?: string[] }): Promise<Prompt[]> {
    let prompts = Array.from(this.prompts.values());
    
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      prompts = prompts.filter((p) =>
        p.prompt.toLowerCase().includes(searchLower) ||
        p.notes?.toLowerCase().includes(searchLower) ||
        p.domain.toLowerCase().includes(searchLower) ||
        p.task.toLowerCase().includes(searchLower)
      );
    }
    
    if (options?.domains && options.domains.length > 0) {
      prompts = prompts.filter((p) => options.domains!.includes(p.domain));
    }
    
    if (options?.tasks && options.tasks.length > 0) {
      prompts = prompts.filter((p) => options.tasks!.includes(p.task));
    }
    
    return prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    return this.prompts.get(id);
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const id = randomUUID();
    const prompt: Prompt = {
      ...insertPrompt,
      id,
      notes: insertPrompt.notes || null,
      createdAt: new Date(),
    };
    this.prompts.set(id, prompt);
    return prompt;
  }

  async getComments(promptId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.promptId === promptId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCommentCount(promptId: string): Promise<number> {
    return Array.from(this.comments.values()).filter((c) => c.promptId === promptId).length;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }
}

export const storage = new MemStorage();
