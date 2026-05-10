import crypto from "crypto";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "fp_salt_2024").digest("hex");
}

export function generateApiKey(): string {
  return "fp_" + crypto.randomBytes(10).toString("hex");
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ id: sessionId, userId, expiresAt });
  return sessionId;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.["session_id"];
  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: "Session expired" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req as Request & { user: typeof user }).user = user;
  next();
}

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    balance: parseFloat(user.balance as unknown as string),
    apiKey: user.apiKey,
    createdAt: user.createdAt.toISOString(),
  };
}
