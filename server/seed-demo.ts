/**
 * Auto-seed DEMO team data on server startup
 * 
 * This runs when the server starts and creates the DEMO team with sample data
 * if it doesn't already exist. Safe to run multiple times.
 */

import { db } from "./db";
import { users, teams, teamMembers, prompts, votes, comments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "./index";

const demoData = {
  users: [
    { id: "47479478", email: "yiehyuheng@gmail.com", firstName: "Donavan", lastName: "Yieh", profileImageUrl: null },
    { id: "mock-user-001", email: "alex.chen@demo.com", firstName: "Alex", lastName: "Chen", profileImageUrl: null },
    { id: "mock-user-002", email: "sarah.johnson@demo.com", firstName: "Sarah", lastName: "Johnson", profileImageUrl: null },
    { id: "mock-user-003", email: "michael.park@demo.com", firstName: "Michael", lastName: "Park", profileImageUrl: null },
    { id: "mock-user-004", email: "emily.davis@demo.com", firstName: "Emily", lastName: "Davis", profileImageUrl: null },
    { id: "mock-user-005", email: "james.wilson@demo.com", firstName: "James", lastName: "Wilson", profileImageUrl: null }
  ],
  teams: [
    { id: "demo-team-001", name: "DEMO", joinCode: "DEMOPASS", leaderId: "47479478" }
  ],
  teamMembers: [
    { id: "664277ab-aa46-47f5-a8d5-d071b966badb", teamId: "demo-team-001", userId: "47479478" },
    { id: "852749b4-84d3-41ab-bf11-421cf7a2da7a", teamId: "demo-team-001", userId: "mock-user-001" },
    { id: "e2aba064-722f-4dd5-9146-2e535ad0ed45", teamId: "demo-team-001", userId: "mock-user-002" },
    { id: "d2b1957a-8ce5-442f-af67-419b4e4bf25b", teamId: "demo-team-001", userId: "mock-user-003" },
    { id: "a1ec237c-af43-46dd-bc2b-8de091496d6f", teamId: "demo-team-001", userId: "mock-user-004" },
    { id: "f21586b0-07db-4794-b510-b9127cf802e5", teamId: "demo-team-001", userId: "mock-user-005" }
  ],
  prompts: [
    { id: "a7d5a592-f125-429e-9d23-d8444e8426dd", title: "Code Review Assistant", prompt: "You are a senior software engineer conducting a code review. Analyze the following code for: 1) Potential bugs or errors, 2) Performance issues, 3) Security vulnerabilities, 4) Code style and best practices, 5) Suggestions for improvement. Be constructive and explain your reasoning.\n\nCode to review:\n{code}", domain: "Engineering", task: "Review & Feedback", notes: "Works great for PR reviews. Adjust the focus areas based on your needs.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4" },
    { id: "b08d68a5-c0a0-4be7-8cc3-724bd0d604a8", title: "Technical Documentation Generator", prompt: "Create comprehensive technical documentation for the following code/API/system. Include: Overview, Prerequisites, Installation steps, Configuration options, Usage examples, API reference (if applicable), Troubleshooting section, and FAQ.\n\nSubject to document:\n{subject}", domain: "Engineering", task: "Documentation", notes: "Produces well-structured docs. Add your company style guide for consistency.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3.5 Sonnet" },
    { id: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", title: "Marketing Email Campaign Writer", prompt: "Write a compelling marketing email for our product launch. Target audience: {audience}. Product: {product}. Key benefits: {benefits}. Tone: Professional but friendly. Include: Attention-grabbing subject line, engaging opening hook, clear value proposition, social proof element, strong CTA, and P.S. line.", domain: "Marketing", task: "Email Drafting", notes: "A/B test the subject lines for best results.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4" },
    { id: "fb3025ac-3ce0-42ae-ba40-4251756dd766", title: "Sales Objection Handler", prompt: "You are an expert sales coach. Provide 3 different responses to handle this sales objection: \"{objection}\". For each response, include: The psychology behind the approach, Word-for-word script, Follow-up question to keep the conversation going. Focus on building trust and addressing the underlying concern.", domain: "Sales", task: "Brainstorming", notes: "Train your team with these scripts during role-play sessions.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3 Opus" },
    { id: "a878020c-ca11-4de6-8ce1-7ba21b1e7b01", title: "Customer Support Response Template", prompt: "Craft a helpful, empathetic customer support response for this issue: {issue}. Guidelines: 1) Acknowledge the frustration, 2) Apologize sincerely, 3) Explain the solution clearly, 4) Provide step-by-step instructions if needed, 5) Offer additional help, 6) End positively. Keep it concise but thorough.", domain: "Customer Support", task: "Content Writing", notes: "Customize the empathy level based on issue severity.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4 Turbo" },
    { id: "8be0391c-a321-446b-b31a-21a2094c05af", title: "Product Requirements Document (PRD)", prompt: "Create a comprehensive Product Requirements Document for: {feature_name}. Include: Executive summary, Problem statement, User personas, User stories with acceptance criteria, Functional requirements, Non-functional requirements, Success metrics, Timeline estimate, and Risks/dependencies.", domain: "Product", task: "Documentation", notes: "Essential for aligning stakeholders before development starts.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3.5 Sonnet" },
    { id: "def90b4f-1aa2-4214-81ab-9e930944b12c", title: "UI/UX Design Critique", prompt: "Analyze this design from a UX perspective: {design_description}. Evaluate: Visual hierarchy, Color and contrast, Typography choices, Spacing and alignment, User flow, Accessibility considerations, Mobile responsiveness, and Loading states. Provide specific, actionable improvements with examples.", domain: "Design", task: "Review & Feedback", notes: "Great for design reviews before handoff to development.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4 Vision" },
    { id: "3c124e3f-d44b-4c74-b938-d9396ba01e81", title: "HR Interview Questions Generator", prompt: "Generate behavioral interview questions for a {role} position. Focus areas: {competencies}. For each question, provide: The competency being assessed, The question itself, What a strong answer looks like, Red flags to watch for. Include a mix of situational and experience-based questions.", domain: "HR", task: "Brainstorming", notes: "Combine with structured scoring rubric for consistent hiring.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4" },
    { id: "8fc34827-7aa8-4409-bc55-e2557129f514", title: "Financial Report Summarizer", prompt: "Summarize this financial report for executive review: {report_content}. Extract: Key financial metrics and YoY changes, Revenue and profit highlights, Cost analysis, Cash flow status, Notable risks or concerns, Strategic recommendations. Present in bullet points suitable for board presentation.", domain: "Finance", task: "Summarization", notes: "Adjust detail level based on audience seniority.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3 Opus" },
    { id: "e68cf18f-5cfa-4bfe-9095-c873dfb4d06a", title: "Contract Clause Analyzer", prompt: "Analyze this contract clause for potential issues: {clause}. Identify: Ambiguous language, One-sided terms, Missing protections, Industry standard deviations, Compliance concerns, Negotiation suggestions. Rate risk level (Low/Medium/High) and provide recommended alternative language.", domain: "Legal", task: "Research", notes: "Not a substitute for legal counsel, but great for first-pass review.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3.5 Sonnet" },
    { id: "19cfd47a-77fd-498b-8f7a-fc3fb17aa41e", title: "Process Improvement Analyst", prompt: "Analyze this operational process and suggest improvements: {process_description}. Evaluate: Current bottlenecks, Automation opportunities, Resource optimization, Quality control gaps, Cycle time reduction. Provide a prioritized list of changes with estimated impact and implementation effort.", domain: "Operations", task: "Data Analysis", notes: "Use with process mining data for best results.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4" },
    { id: "cd749d52-a784-4560-8792-84c280f0659f", title: "Python Code Generator", prompt: "Write clean, production-ready Python code for: {task_description}. Requirements: Use type hints, Include docstrings, Handle errors gracefully, Follow PEP 8 style, Add comments for complex logic, Include example usage. Optimize for readability and maintainability.", domain: "Engineering", task: "Code Generation", notes: "Specify Python version if you need version-specific features.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3.5 Sonnet" },
    { id: "6a6d5a32-db36-4912-832e-1accf8a457ca", title: "Blog Post Content Creator", prompt: "Write an engaging blog post about: {topic}. Target audience: {audience}. Tone: {tone}. Include: Compelling headline, Hook introduction, Subheadings for scannability, Key takeaways, Statistics or examples, Call-to-action. Length: approximately {word_count} words. Optimize for SEO with natural keyword usage.", domain: "Marketing", task: "Content Writing", notes: "Add your brand voice guidelines for consistency.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4 Turbo" },
    { id: "70ed4e95-6b4f-4ca8-8c4c-40e1e6a8234b", title: "Data Analysis Report Generator", prompt: "Analyze this dataset and create a comprehensive report: {data_description}. Include: Executive summary, Key findings with visualizations, Statistical analysis, Trends and patterns, Anomalies detected, Actionable recommendations, Methodology notes. Present insights for both technical and business audiences.", domain: "Engineering", task: "Data Analysis", notes: "Works best with structured data. Include column descriptions.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "Claude 3 Opus" },
    { id: "0f12c661-ef3c-4642-8295-44978a9fca69", title: "Meeting Notes to Action Items", prompt: "Convert these meeting notes into organized action items: {meeting_notes}. Extract: Decisions made, Action items with owners and due dates, Open questions, Follow-up meetings needed, Key discussion points. Format as a structured summary that can be shared with attendees and stakeholders.", domain: "Operations", task: "Summarization", notes: "Use immediately after meetings while context is fresh.", authorId: "47479478", authorName: "Donavan Yieh", teamId: "demo-team-001", modelUsed: "GPT-4" }
  ],
  votes: [
    { id: "686683e5-0ee8-4cdb-8d0d-e2896cd8b9bb", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", userId: "mock-user-001", value: 1 },
    { id: "77caeb05-2e4e-4aa8-af88-a96e25a77c03", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", userId: "mock-user-002", value: 1 },
    { id: "6307c28f-1130-485f-b335-d6c72fbbb956", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", userId: "mock-user-003", value: 1 },
    { id: "56a2f06f-2f22-483f-913c-156ec3a36d57", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", userId: "mock-user-004", value: 1 },
    { id: "f5e35f31-a900-438e-98d1-aec41016b840", promptId: "b08d68a5-c0a0-4be7-8cc3-724bd0d604a8", userId: "mock-user-001", value: 1 },
    { id: "c106ad73-eab3-49ef-82a7-4946b3762318", promptId: "b08d68a5-c0a0-4be7-8cc3-724bd0d604a8", userId: "mock-user-003", value: 1 },
    { id: "42e7ac62-06bb-4787-b1ae-3531a49352db", promptId: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", userId: "mock-user-002", value: 1 },
    { id: "57e29cc1-d73b-4348-a10c-0c34c66fff44", promptId: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", userId: "mock-user-005", value: 1 },
    { id: "c62aae80-78f5-4d78-9859-a9e651460e74", promptId: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", userId: "mock-user-004", value: -1 },
    { id: "2a9192c3-d594-4a19-beaf-f4b137bd8625", promptId: "fb3025ac-3ce0-42ae-ba40-4251756dd766", userId: "mock-user-001", value: 1 },
    { id: "4e8006cd-6712-4989-9c04-b305bd698cce", promptId: "fb3025ac-3ce0-42ae-ba40-4251756dd766", userId: "mock-user-002", value: 1 },
    { id: "2b03e21e-9597-4e93-9c0e-8f3fbb536929", promptId: "fb3025ac-3ce0-42ae-ba40-4251756dd766", userId: "mock-user-003", value: 1 },
    { id: "ee653241-952e-4fc7-9151-fdab34d20ac4", promptId: "cd749d52-a784-4560-8792-84c280f0659f", userId: "mock-user-001", value: 1 },
    { id: "d42a62b6-962a-4e84-8e68-2caaacf9fdec", promptId: "cd749d52-a784-4560-8792-84c280f0659f", userId: "mock-user-002", value: 1 },
    { id: "33f4ce1a-e447-4765-a17c-14ffc23a5b56", promptId: "cd749d52-a784-4560-8792-84c280f0659f", userId: "mock-user-003", value: 1 },
    { id: "1a27a3b7-558a-4a4b-a848-354d3dca4b75", promptId: "cd749d52-a784-4560-8792-84c280f0659f", userId: "mock-user-004", value: 1 },
    { id: "fdc13442-a7aa-497c-bcef-850fdf254f8b", promptId: "cd749d52-a784-4560-8792-84c280f0659f", userId: "mock-user-005", value: 1 },
    { id: "5b55268c-dc1f-44af-b141-b0399a03004b", promptId: "70ed4e95-6b4f-4ca8-8c4c-40e1e6a8234b", userId: "mock-user-003", value: 1 },
    { id: "3b900067-df7e-43b6-b6ba-9cddc80281c8", promptId: "70ed4e95-6b4f-4ca8-8c4c-40e1e6a8234b", userId: "mock-user-005", value: 1 },
    { id: "3ea314d0-94db-488b-acbf-2cef663ace5e", promptId: "def90b4f-1aa2-4214-81ab-9e930944b12c", userId: "mock-user-004", value: 1 },
    { id: "28b13b5f-f84e-4476-8e42-bbbd36be278e", promptId: "3c124e3f-d44b-4c74-b938-d9396ba01e81", userId: "mock-user-002", value: 1 },
    { id: "f0624573-ad41-43c5-a4ca-870faa4321fc", promptId: "3c124e3f-d44b-4c74-b938-d9396ba01e81", userId: "mock-user-005", value: -1 },
    { id: "023edecc-fb6b-4990-b37e-b3fb285febc6", promptId: "8fc34827-7aa8-4409-bc55-e2557129f514", userId: "mock-user-001", value: 1 },
    { id: "3adf0ee4-ebfc-4ec2-9196-43446b26b3ea", promptId: "8fc34827-7aa8-4409-bc55-e2557129f514", userId: "mock-user-004", value: 1 }
  ],
  comments: [
    { id: "f1c2aa95-2186-455e-8f36-b22d3e21e06b", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", content: "This has become my go-to for all PR reviews. I usually add \"Focus on security\" at the end for sensitive code.", authorId: "mock-user-001", authorName: "Alex Chen" },
    { id: "841125c5-7e27-40ed-8876-547b459a9874", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", content: "Great prompt! I modified it to include architecture suggestions and it works even better for larger refactors.", authorId: "mock-user-002", authorName: "Sarah Johnson" },
    { id: "c885b2ec-a6df-4caf-8b3a-fc0bf14b3d32", promptId: "a7d5a592-f125-429e-9d23-d8444e8426dd", content: "Used this on our legacy codebase - found 3 bugs that our tests missed!", authorId: "mock-user-003", authorName: "Michael Park" },
    { id: "7c756d51-33d7-45d6-a064-acc1b1d1e597", promptId: "cd749d52-a784-4560-8792-84c280f0659f", content: "The type hints are so helpful. I also add \"include unit tests\" and it generates pytest tests too.", authorId: "mock-user-004", authorName: "Emily Davis" },
    { id: "edfb4289-b60f-4d05-b5c2-6b97401d34fa", promptId: "cd749d52-a784-4560-8792-84c280f0659f", content: "Works great with Claude. For async code, I add \"use asyncio patterns\" to the requirements.", authorId: "mock-user-001", authorName: "Alex Chen" },
    { id: "2e41950e-dc68-4b2e-9454-20ec96067777", promptId: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", content: "The P.S. line suggestion is genius - our click rates went up 15% after we started using them consistently.", authorId: "mock-user-002", authorName: "Sarah Johnson" },
    { id: "3ddc863f-2835-42fe-8cf4-5b65af505619", promptId: "9d6ea3b1-71fb-4b60-8d75-6bf5156683d1", content: "I found it works best when you give very specific audience details. Vague descriptions = generic emails.", authorId: "mock-user-005", authorName: "James Wilson" },
    { id: "f8c4a26c-2b14-43c6-8c02-1ae74905d017", promptId: "b08d68a5-c0a0-4be7-8cc3-724bd0d604a8", content: "Saved hours on API documentation. Pro tip: feed it the actual code and let it infer the structure.", authorId: "mock-user-003", authorName: "Michael Park" },
    { id: "3f6e87d9-5b99-4b94-95ee-068fbbcc989b", promptId: "fb3025ac-3ce0-42ae-ba40-4251756dd766", content: "Our SDR team practices with these scripts weekly. The psychology explanations help them understand WHY each approach works.", authorId: "mock-user-001", authorName: "Alex Chen" },
    { id: "83a9c976-835c-44aa-9c90-d45e9923a187", promptId: "fb3025ac-3ce0-42ae-ba40-4251756dd766", content: "Added \"for enterprise B2B SaaS\" to get more specific scripts for our market.", authorId: "mock-user-005", authorName: "James Wilson" },
    { id: "075aaab4-69b8-41a0-8715-a3dd629453df", promptId: "70ed4e95-6b4f-4ca8-8c4c-40e1e6a8234b", content: "This plus Claude with the artifacts feature = instant dashboards. Highly recommend.", authorId: "mock-user-003", authorName: "Michael Park" },
    { id: "604ec0c9-faf7-4593-9b00-018de4a52f10", promptId: "def90b4f-1aa2-4214-81ab-9e930944b12c", content: "Great for accessibility reviews. I added WCAG compliance as an evaluation criteria and it catches contrast issues really well.", authorId: "mock-user-004", authorName: "Emily Davis" },
    { id: "c1d90ca4-7242-4ab3-866b-49401db35e85", promptId: "8be0391c-a321-446b-b31a-21a2094c05af", content: "Our PM team uses this as a starting template for every new feature. Saves about 2 hours per PRD.", authorId: "mock-user-002", authorName: "Sarah Johnson" }
  ]
};

export async function seedDemoData(): Promise<void> {
  try {
    // Check if DEMO team already exists
    const existingTeam = await db.select().from(teams).where(eq(teams.id, "demo-team-001"));
    
    if (existingTeam.length > 0) {
      log("DEMO team already exists, skipping seed", "seed");
      return;
    }

    log("Seeding DEMO team data...", "seed");

    // 1. Insert mock users (skip the real user as they may already exist via auth)
    for (const user of demoData.users.filter(u => u.id.startsWith("mock-"))) {
      const existing = await db.select().from(users).where(eq(users.id, user.id));
      if (existing.length === 0) {
        await db.insert(users).values({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        });
      }
    }

    // 2. Insert team
    for (const team of demoData.teams) {
      await db.insert(teams).values({
        id: team.id,
        name: team.name,
        joinCode: team.joinCode,
        leaderId: team.leaderId,
      });
    }

    // 3. Insert team members (only mock users, real user can join manually)
    for (const member of demoData.teamMembers.filter(m => m.userId.startsWith("mock-"))) {
      await db.insert(teamMembers).values({
        id: member.id,
        teamId: member.teamId,
        userId: member.userId,
      });
    }

    // 4. Insert prompts
    for (const prompt of demoData.prompts) {
      await db.insert(prompts).values({
        id: prompt.id,
        title: prompt.title,
        prompt: prompt.prompt,
        domain: prompt.domain,
        task: prompt.task,
        notes: prompt.notes,
        modelUsed: prompt.modelUsed,
        authorId: prompt.authorId,
        authorName: prompt.authorName,
        teamId: prompt.teamId,
      });
    }

    // 5. Insert votes
    for (const vote of demoData.votes) {
      await db.insert(votes).values({
        id: vote.id,
        promptId: vote.promptId,
        userId: vote.userId,
        value: vote.value,
      });
    }

    // 6. Insert comments
    for (const comment of demoData.comments) {
      await db.insert(comments).values({
        id: comment.id,
        promptId: comment.promptId,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.authorName,
      });
    }

    log("DEMO team seeded successfully! Join code: DEMOPASS", "seed");

  } catch (error) {
    log(`Failed to seed DEMO data: ${error}`, "seed");
  }
}
