import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateWithdrawalBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/withdrawals", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, bankName, accountNumber, accountName } = parsed.data;
  const currentBalance = parseFloat(user.balance as unknown as string);
  if (currentBalance < amount) {
    res.status(400).json({ error: "Saldo tidak cukup" });
    return;
  }
  const newBalance = (currentBalance - amount).toFixed(2);
  await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, user.id));
  const [tx] = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "withdrawal",
    amount: amount.toString(),
    status: "pending",
    description: `Penarikan ke ${bankName} - ${accountName}`,
    bankName,
    accountNumber,
    accountName,
  }).returning();
  res.json({
    id: tx.id,
    type: tx.type,
    amount: parseFloat(tx.amount as unknown as string),
    status: tx.status,
    description: tx.description,
    createdAt: tx.createdAt.toISOString(),
  });
});

export default router;
