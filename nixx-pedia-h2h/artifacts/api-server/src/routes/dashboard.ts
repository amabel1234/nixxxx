import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, user.id));
  const totalDeposit = txs.filter(t => t.type === "deposit" && t.status === "success")
    .reduce((sum, t) => sum + parseFloat(t.amount as unknown as string), 0);
  const totalWithdrawal = txs.filter(t => t.type === "withdrawal" && t.status === "success")
    .reduce((sum, t) => sum + parseFloat(t.amount as unknown as string), 0);
  const pendingTransactions = txs.filter(t => t.status === "pending").length;
  res.json({
    balance: parseFloat(user.balance as unknown as string),
    totalDeposit,
    totalWithdrawal,
    totalTransactions: txs.length,
    pendingTransactions,
  });
});

export default router;
