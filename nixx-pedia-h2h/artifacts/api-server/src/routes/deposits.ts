import { Router } from "express";
import type { IRouter } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateQrisDepositBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/deposits/qris", requireAuth, async (req, res): Promise<void> => {
  const user = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const parsed = CreateQrisDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount } = parsed.data;
  const [tx] = await db.insert(transactionsTable).values({
    userId: user.id,
    type: "deposit",
    amount: amount.toString(),
    status: "pending",
    description: `Top Up QRIS Rp ${amount.toLocaleString("id-ID")}`,
  }).returning();

  const qrText = `00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214400198053772230303UMI51440014ID.CO.QRIS.WWW0215ID20253989964000303UMI5204541153033605802ID5924ABDILAHH STORE OK24112696011TASIKMALAYA61054611162070703A0163046090${tx.id.toString().padStart(8, "0")}6304`;
  const checksum = computeCRC16(qrText);
  const qrPayload = qrText + checksum;
  const qrData = `https://barcode.aspose.app/barcode/qr?data=${encodeURIComponent(qrPayload)}&size=300x300`;

  res.json({ success: true, qrData, transactionId: tx.id });
});

function computeCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export default router;
