import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(desc(transactionsTable.createdAt));
  res.json(txs.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: parseFloat(tx.amount as unknown as string),
    status: tx.status,
    description: tx.description,
    createdAt: tx.createdAt.toISOString(),
  })));
});

export default router;
