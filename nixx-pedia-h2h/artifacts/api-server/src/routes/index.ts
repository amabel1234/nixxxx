import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import apikeysRouter from "./apikeys";
import depositsRouter from "./deposits";
import withdrawalsRouter from "./withdrawals";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(apikeysRouter);
router.use(depositsRouter);
router.use(withdrawalsRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);

export default router;
