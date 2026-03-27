import { Router } from "express";
import { db } from "@workspace/db";
import { gameStatesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

interface GamePlayer {
  username: string;
  role: string;
  isAlive: boolean;
  isRevealed: boolean;
  votes?: number;
}

const IMPOSTER_ROLES = ["Scientist", "Engineer", "Doctor", "Detective", "Chef", "Artist", "Pilot", "Hacker", "Mechanic", "Botanist", "Medic", "Navigator", "Commander", "Biologist", "Geologist"];
const WEREWOLF_ROLES_MAP: Record<string, string[]> = {
  "werewolf": ["Werewolf"],
  "villager": ["Villager", "Doctor", "Seer", "Hunter", "Witch", "Bodyguard"],
};
const DRACULA_ROLES_MAP = {
  "evil": ["Dracula", "Minion"],
  "good": ["Villager", "Investigator", "Medium", "Monk", "Fortuneteller", "Exorcist"],
};

function assignImposterRoles(players: string[], count: number): GamePlayer[] {
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const roles = [...IMPOSTER_ROLES].sort(() => Math.random() - 0.5);
  const imposters = new Set(shuffledPlayers.slice(0, count).map(p => p));

  return shuffledPlayers.map((username, i) => ({
    username,
    role: imposters.has(username) ? "Imposter" : roles[i % roles.length],
    isAlive: true,
    isRevealed: false,
    votes: 0,
  }));
}

function assignWerewolfRoles(players: string[]): GamePlayer[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const wolfCount = players.length <= 4 ? 1 : players.length <= 7 ? 2 : 3;
  const goodRoles = ["Doctor", "Seer", "Hunter", "Witch", "Bodyguard"].sort(() => Math.random() - 0.5);

  return shuffled.map((username, i) => {
    let role: string;
    if (i < wolfCount) {
      role = "Werewolf";
    } else {
      role = goodRoles[i - wolfCount] || "Villager";
    }
    return { username, role, isAlive: true, isRevealed: false, votes: 0 };
  });
}

function assignDraculaRoles(players: string[]): GamePlayer[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const draculaCount = players.length <= 5 ? 1 : 2;
  const goodRoles = ["Investigator", "Medium", "Monk", "Fortuneteller", "Exorcist"].sort(() => Math.random() - 0.5);

  return shuffled.map((username, i) => {
    let role: string;
    if (i === 0) {
      role = "Dracula";
    } else if (i < draculaCount) {
      role = "Minion";
    } else {
      role = goodRoles[i - draculaCount] || "Villager";
    }
    return { username, role, isAlive: true, isRevealed: false, votes: 0 };
  });
}

router.get("/imposter", async (req, res) => {
  const [game] = await db.select().from(gameStatesTable)
    .where(eq(gameStatesTable.gameType, "imposter"))
    .orderBy(desc(gameStatesTable.createdAt))
    .limit(1);
  return res.json(game || null);
});

router.post("/imposter", async (req, res) => {
  const { players, gameType } = req.body;
  if (!players || players.length < 3) return res.status(400).json({ error: "Minimum 3 players required" });
  if (players.length > 10) return res.status(400).json({ error: "Maximum 10 players" });

  const type = gameType || "imposter";
  let gamePlayers: GamePlayer[];

  if (type === "werewolf") {
    gamePlayers = assignWerewolfRoles(players);
  } else if (type === "dracula") {
    gamePlayers = assignDraculaRoles(players);
  } else {
    const imposterCount = players.length < 5 ? 1 : 2;
    gamePlayers = assignImposterRoles(players, imposterCount);
  }

  const [game] = await db.insert(gameStatesTable).values({
    gameType: type,
    status: "active",
    players: gamePlayers,
    phase: "discussion",
    round: 1,
    winner: null,
  }).returning();

  return res.json(game);
});

router.post("/imposter/action", async (req, res) => {
  const { action, targetUsername, actorUsername } = req.body;

  const [game] = await db.select().from(gameStatesTable)
    .where(eq(gameStatesTable.gameType, "imposter"))
    .orderBy(desc(gameStatesTable.createdAt))
    .limit(1);

  if (!game) return res.status(404).json({ error: "No active game" });

  let players = game.players as GamePlayer[];

  if (action === "vote" && targetUsername) {
    players = players.map(p => p.username === targetUsername ? { ...p, votes: (p.votes || 0) + 1 } : p);
  }

  if (action === "eliminate" && targetUsername) {
    players = players.map(p => p.username === targetUsername ? { ...p, isAlive: false, isRevealed: true } : p);

    // Check win conditions
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveImposters = alivePlayers.filter(p => p.role === "Imposter" || p.role === "Werewolf" || p.role === "Dracula" || p.role === "Minion");
    const aliveCrew = alivePlayers.filter(p => p.role !== "Imposter" && p.role !== "Werewolf" && p.role !== "Dracula" && p.role !== "Minion");

    let winner = null;
    if (aliveImposters.length === 0) winner = "crew";
    if (aliveImposters.length >= aliveCrew.length) winner = "imposters";

    if (winner) {
      const [updated] = await db.update(gameStatesTable)
        .set({ players, status: "ended", phase: "end", winner })
        .where(eq(gameStatesTable.id, game.id))
        .returning();
      return res.json(updated);
    }
  }

  if (action === "next_phase") {
    const phases = ["discussion", "voting", "elimination"];
    const currentIdx = phases.indexOf(game.phase || "discussion");
    const nextPhase = phases[(currentIdx + 1) % phases.length];
    // Reset votes when going to voting phase
    if (nextPhase === "voting") {
      players = players.map(p => ({ ...p, votes: 0 }));
    }
    const [updated] = await db.update(gameStatesTable)
      .set({ players, phase: nextPhase, round: nextPhase === "discussion" ? (game.round || 1) + 1 : game.round })
      .where(eq(gameStatesTable.id, game.id))
      .returning();
    return res.json(updated);
  }

  if (action === "reset") {
    await db.delete(gameStatesTable).where(eq(gameStatesTable.id, game.id));
    return res.json({ success: true, status: "reset" });
  }

  const [updated] = await db.update(gameStatesTable).set({ players }).where(eq(gameStatesTable.id, game.id)).returning();
  return res.json(updated);
});

// Get game by type
router.get("/:type", async (req, res) => {
  const type = req.params.type;
  const [game] = await db.select().from(gameStatesTable)
    .where(eq(gameStatesTable.gameType, type))
    .orderBy(desc(gameStatesTable.createdAt))
    .limit(1);
  return res.json(game || null);
});

router.post("/:type", async (req, res) => {
  const { players } = req.body;
  const type = req.params.type;
  if (!players || players.length < 3) return res.status(400).json({ error: "Minimum 3 players required" });

  let gamePlayers: GamePlayer[];
  if (type === "werewolf") {
    gamePlayers = assignWerewolfRoles(players);
  } else if (type === "dracula") {
    gamePlayers = assignDraculaRoles(players);
  } else {
    const imposterCount = players.length < 5 ? 1 : 2;
    gamePlayers = assignImposterRoles(players, imposterCount);
  }

  const [game] = await db.insert(gameStatesTable).values({
    gameType: type,
    status: "active",
    players: gamePlayers,
    phase: type === "ludo" ? "playing" : "discussion",
    round: 1,
    winner: null,
  }).returning();

  return res.json(game);
});

router.post("/:type/action", async (req, res) => {
  const type = req.params.type;
  const { action, targetUsername, actorUsername } = req.body;

  const [game] = await db.select().from(gameStatesTable)
    .where(eq(gameStatesTable.gameType, type))
    .orderBy(desc(gameStatesTable.createdAt))
    .limit(1);

  if (!game) return res.status(404).json({ error: "No active game" });

  let players = game.players as GamePlayer[];

  if (action === "vote" && targetUsername) {
    players = players.map(p => p.username === targetUsername ? { ...p, votes: (p.votes || 0) + 1 } : p);
  }

  if (action === "eliminate" && targetUsername) {
    players = players.map(p => p.username === targetUsername ? { ...p, isAlive: false, isRevealed: true } : p);

    const alivePlayers = players.filter(p => p.isAlive);
    const aliveEvil = alivePlayers.filter(p => ["Imposter", "Werewolf", "Dracula", "Minion"].includes(p.role));
    const aliveGood = alivePlayers.filter(p => !["Imposter", "Werewolf", "Dracula", "Minion"].includes(p.role));

    let winner = null;
    if (aliveEvil.length === 0) winner = "good";
    if (aliveEvil.length >= aliveGood.length) winner = "evil";

    if (winner) {
      const [updated] = await db.update(gameStatesTable)
        .set({ players, status: "ended", phase: "end", winner })
        .where(eq(gameStatesTable.id, game.id))
        .returning();
      return res.json(updated);
    }
  }

  if (action === "next_phase") {
    const phases = ["discussion", "voting", "elimination"];
    const currentIdx = phases.indexOf(game.phase || "discussion");
    const nextPhase = phases[(currentIdx + 1) % phases.length];
    if (nextPhase === "voting") {
      players = players.map(p => ({ ...p, votes: 0 }));
    }
    const [updated] = await db.update(gameStatesTable)
      .set({ players, phase: nextPhase })
      .where(eq(gameStatesTable.id, game.id))
      .returning();
    return res.json(updated);
  }

  if (action === "reset") {
    await db.delete(gameStatesTable).where(eq(gameStatesTable.id, game.id));
    return res.json({ success: true, status: "reset" });
  }

  const [updated] = await db.update(gameStatesTable).set({ players }).where(eq(gameStatesTable.id, game.id)).returning();
  return res.json(updated);
});

export default router;
