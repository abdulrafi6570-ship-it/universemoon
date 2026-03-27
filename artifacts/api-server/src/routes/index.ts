import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import membersRouter from "./members";
import chatRouter from "./chat";
import nglRouter from "./ngl";
import contentRouter from "./content";
import gamesRouter from "./games";
import leaderboardRouter from "./leaderboard";
import socialRouter from "./social";
import usersRouter from "./users";
import uploadRouter from "./upload";
import adminEventsRouter from "./admin-events";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/members", membersRouter);
router.use("/chat", chatRouter);
router.use("/ngl", nglRouter);
router.use(contentRouter);
router.use("/games", gamesRouter);
router.use("/leaderboard", leaderboardRouter);
router.use(socialRouter);
router.use("/users", usersRouter);
router.use("/upload", uploadRouter);
router.use("/events", adminEventsRouter);

export default router;
