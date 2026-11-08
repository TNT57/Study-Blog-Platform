// Adds demo data to your local database: `pnpm db:seed`
// Safe to run twice: it skips everything if the demo user already exists.
import "./load-env";

import { closePool } from "@/lib/db";
import { DEMO_EMAIL } from "@/lib/demo";
import { createPost } from "@/models/post.model";
import { createUser, findUserByEmail } from "@/models/user.model";

const DEMO_POSTS = [
  {
    title: "How I finally understood Big-O notation",
    content:
      "I used to memorise O(n log n) without knowing why.\n\nThis week I drew each loop on paper and counted the steps. Here is what clicked.",
  },
  {
    title: "SQL joins explained with a school canteen",
    content:
      "An INNER JOIN is the students who bought lunch AND have a student card.\n\nA LEFT JOIN keeps every student, even the ones who skipped lunch.",
  },
  {
    title: "My Pomodoro routine for exam week",
    content:
      "Four focus rounds, then a long walk. Before each round I write one sentence about what I want to finish.",
  },
  {
    title: "Hashing is not encryption",
    content:
      "Encryption can be undone with a key. Hashing is one-way, which is exactly why we use it for passwords.",
  },
];

async function main() {
  const email = DEMO_EMAIL;
  if (await findUserByEmail(email)) {
    console.log("Seed skipped: the demo user already exists.");
    return;
  }

  // "!" is not a real Argon2 hash, so nobody can log in as demo (login comes in M3).
  const demo = await createUser({
    username: "demo",
    email,
    passwordHash: "!",
    timeZone: "Australia/Adelaide",
  });
  for (const post of DEMO_POSTS) {
    await createPost({ authorId: demo.id, ...post });
  }
  console.log(`Seeded: user "demo" and ${DEMO_POSTS.length} posts.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closePool);
