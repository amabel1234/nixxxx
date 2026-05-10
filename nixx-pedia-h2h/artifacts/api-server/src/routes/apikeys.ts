import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, generateApiKey, formatUser } from "../lib/auth";

const router: IRouter = Router();

router.post("/api-keys/regenerate", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const newApiKey = generateApiKey();
  await db.update(usersTable).set({ apiKey: newApiKey }).where(eq(usersTable.id, user.id));
  res.json({ apiKey: newApiKey });
});

export default router;
