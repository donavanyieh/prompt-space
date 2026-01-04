/**
 * Seed script to populate the DEMO team data in production
 * 
 * Run with: npm run seed:demo
 * 
 * This script is idempotent - it will skip records that already exist.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { users, teams, teamMembers, prompts, votes, comments } from "../shared/schema";
import { eq } from "drizzle-orm";
import demoData from "./demo-data.json";

const { Pool } = pg;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    console.log("\n--- Seeding DEMO team data ---\n");

    // 1. Insert users (skip if already exist)
    console.log("Inserting users...");
    for (const user of demoData.users) {
      const existing = await db.select().from(users).where(eq(users.id, user.id));
      if (existing.length === 0) {
        await db.insert(users).values({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        });
        console.log(`  + Created user: ${user.firstName} ${user.lastName}`);
      } else {
        console.log(`  - User already exists: ${user.firstName} ${user.lastName}`);
      }
    }

    // 2. Insert teams (skip if already exist)
    console.log("\nInserting teams...");
    for (const team of demoData.teams) {
      const existing = await db.select().from(teams).where(eq(teams.id, team.id));
      if (existing.length === 0) {
        await db.insert(teams).values({
          id: team.id,
          name: team.name,
          joinCode: team.joinCode,
          leaderId: team.leaderId,
        });
        console.log(`  + Created team: ${team.name} (join code: ${team.joinCode})`);
      } else {
        console.log(`  - Team already exists: ${team.name}`);
      }
    }

    // 3. Insert team members (skip if already exist)
    console.log("\nInserting team members...");
    for (const member of demoData.teamMembers) {
      const existing = await db.select().from(teamMembers).where(eq(teamMembers.id, member.id));
      if (existing.length === 0) {
        await db.insert(teamMembers).values({
          id: member.id,
          teamId: member.teamId,
          userId: member.userId,
        });
        console.log(`  + Added member: ${member.userId} to team ${member.teamId}`);
      } else {
        console.log(`  - Member already exists: ${member.userId}`);
      }
    }

    // 4. Insert prompts (skip if already exist)
    console.log("\nInserting prompts...");
    for (const prompt of demoData.prompts) {
      const existing = await db.select().from(prompts).where(eq(prompts.id, prompt.id));
      if (existing.length === 0) {
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
        console.log(`  + Created prompt: ${prompt.title}`);
      } else {
        console.log(`  - Prompt already exists: ${prompt.title}`);
      }
    }

    // 5. Insert votes (skip if already exist)
    console.log("\nInserting votes...");
    let votesCreated = 0;
    let votesSkipped = 0;
    for (const vote of demoData.votes) {
      const existing = await db.select().from(votes).where(eq(votes.id, vote.id));
      if (existing.length === 0) {
        await db.insert(votes).values({
          id: vote.id,
          promptId: vote.promptId,
          userId: vote.userId,
          value: vote.value,
        });
        votesCreated++;
      } else {
        votesSkipped++;
      }
    }
    console.log(`  + Created ${votesCreated} votes, skipped ${votesSkipped} existing`);

    // 6. Insert comments (skip if already exist)
    console.log("\nInserting comments...");
    let commentsCreated = 0;
    let commentsSkipped = 0;
    for (const comment of demoData.comments) {
      const existing = await db.select().from(comments).where(eq(comments.id, comment.id));
      if (existing.length === 0) {
        await db.insert(comments).values({
          id: comment.id,
          promptId: comment.promptId,
          content: comment.content,
          authorId: comment.authorId,
          authorName: comment.authorName,
        });
        commentsCreated++;
      } else {
        commentsSkipped++;
      }
    }
    console.log(`  + Created ${commentsCreated} comments, skipped ${commentsSkipped} existing`);

    console.log("\n--- Seed complete! ---");
    console.log(`
Summary:
- Users: ${demoData.users.length}
- Teams: ${demoData.teams.length}
- Team Members: ${demoData.teamMembers.length}
- Prompts: ${demoData.prompts.length}
- Votes: ${demoData.votes.length}
- Comments: ${demoData.comments.length}

Join the DEMO team with code: DEMOPASS
`);

  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
