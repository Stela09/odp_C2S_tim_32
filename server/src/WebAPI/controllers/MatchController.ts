import { Request, Response, Router } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { AuditRepository } from "../../Database/repositories/audit/AuditRepository";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class MatchController {
  private readonly router = Router();

  public constructor(
    private readonly db: DbManager,
    private readonly auditRepo?: AuditRepository
  ) {
    this.router.get("/matches/tournament/:tournamentId", this.getByTournament.bind(this));
    this.router.get("/matches/:id", this.getById.bind(this));
    this.router.post("/tournaments/:id/generate-bracket", authenticate, authorize(UserRole.ADMIN), this.generateBracket.bind(this));
    this.router.patch("/matches/:id/result", authenticate, authorize(UserRole.ADMIN), this.updateResult.bind(this));
    this.router.post("/matches/:id/players", authenticate, this.setPlayers.bind(this));
  }

  private async getByTournament(req: Request, res: Response): Promise<void> {
    const tournamentId = Number(req.params.tournamentId);
    if (!Number.isInteger(tournamentId)) {
      res.status(400).json({ success: false, message: "Invalid tournament id" });
      return;
    }

    const dbRes = await this.db.getReadConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [rows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name, w.name AS winner_name
         FROM matches m
         LEFT JOIN teams t1 ON t1.id = m.team1_id
         LEFT JOIN teams t2 ON t2.id = m.team2_id
         LEFT JOIN teams w ON w.id = m.winner_id
         WHERE m.tournament_id = ?
         ORDER BY m.round ASC, m.id ASC`,
        [tournamentId]
      );

      res.status(200).json({ success: true, data: rows });
    } finally {
      dbRes.conn.release();
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid match id" });
      return;
    }

    const dbRes = await this.db.getReadConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [matches] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT m.*, t1.name AS team1_name, t2.name AS team2_name, w.name AS winner_name
         FROM matches m
         LEFT JOIN teams t1 ON t1.id = m.team1_id
         LEFT JOIN teams t2 ON t2.id = m.team2_id
         LEFT JOIN teams w ON w.id = m.winner_id
         WHERE m.id = ?`,
        [id]
      );

      if (matches.length === 0) {
        res.status(404).json({ success: false, message: "Match not found" });
        return;
      }

      const [players] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT mp.*, u.gamer_tag, t.name AS team_name
         FROM match_players mp
         JOIN users u ON u.id = mp.user_id
         JOIN teams t ON t.id = mp.team_id
         WHERE mp.match_id = ?
         ORDER BY t.name ASC, u.gamer_tag ASC`,
        [id]
      );

      res.status(200).json({ success: true, data: { ...matches[0], players } });
    } finally {
      dbRes.conn.release();
    }
  }

  private async generateBracket(req: Request, res: Response): Promise<void> {
    const tournamentId = Number(req.params.id);
    if (!Number.isInteger(tournamentId)) {
      res.status(400).json({ success: false, message: "Invalid tournament id" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      await dbRes.conn.beginTransaction();

      const [existing] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT id FROM matches WHERE tournament_id = ? LIMIT 1`,
        [tournamentId]
      );

      if (existing.length > 0) {
        await dbRes.conn.rollback();
        res.status(409).json({ success: false, message: "Bracket je vec generisan" });
        return;
      }

      const [teams] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT tr.team_id, t.name
         FROM tournament_registrations tr
         JOIN teams t ON t.id = tr.team_id
         WHERE tr.tournament_id = ? AND tr.status IN ('pending', 'confirmed')
         ORDER BY COALESCE(tr.seed, tr.team_id), tr.registered_at ASC`,
        [tournamentId]
      );

      if (teams.length < 2) {
        await dbRes.conn.rollback();
        res.status(400).json({ success: false, message: "Potrebna su bar dva prijavljena tima" });
        return;
      }

      const createdIds: number[] = [];
      for (let i = 0; i < teams.length; i += 2) {
        const team1 = teams[i];
        const team2 = teams[i + 1] ?? null;
        const [result] = await dbRes.conn.execute<ResultSetHeader>(
          `INSERT INTO matches (tournament_id, team1_id, team2_id, round, status, scheduled_at)
           VALUES (?, ?, ?, 1, 'scheduled', NULL)`,
          [tournamentId, team1.team_id, team2?.team_id ?? null]
        );
        createdIds.push(result.insertId);
      }

      await dbRes.conn.execute(
        `UPDATE tournaments SET status = 'active' WHERE id = ?`,
        [tournamentId]
      );

      await dbRes.conn.commit();
      await this.auditRepo?.log(req.user?.id ?? null, "GENERATE_BRACKET", "tournament", tournamentId);

      res.status(201).json({ success: true, data: { matchIds: createdIds } });
    } catch (err) {
      await dbRes.conn.rollback();
      res.status(500).json({ success: false, message: "Bracket nije generisan" });
    } finally {
      dbRes.conn.release();
    }
  }

  private async updateResult(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const { score, winner_id } = req.body as { score?: string; winner_id?: number };

    if (!Number.isInteger(id) || !score || !/^\d+:\d+$/.test(score) || !Number.isInteger(Number(winner_id))) {
      res.status(400).json({ success: false, message: "Invalid result" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [matches] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT team1_id, team2_id FROM matches WHERE id = ?`,
        [id]
      );

      if (matches.length === 0) {
        res.status(404).json({ success: false, message: "Match not found" });
        return;
      }

      const match = matches[0];
      if (![match.team1_id, match.team2_id].includes(Number(winner_id))) {
        res.status(400).json({ success: false, message: "Winner must be one of the match teams" });
        return;
      }

      await dbRes.conn.execute(
        `UPDATE matches SET score = ?, winner_id = ?, status = 'completed' WHERE id = ?`,
        [score, Number(winner_id), id]
      );

      await this.auditRepo?.log(req.user?.id ?? null, "UPDATE_MATCH_RESULT", "match", id);
      res.status(200).json({ success: true, message: "Result saved" });
    } finally {
      dbRes.conn.release();
    }
  }

  private async setPlayers(req: Request, res: Response): Promise<void> {
    const matchId = Number(req.params.id);
    const userId = req.user?.id;
    const { team_id, player_ids, performance_notes } = req.body as {
      team_id?: number;
      player_ids?: number[];
      performance_notes?: string;
    };

    if (!userId || !Number.isInteger(matchId) || !Number.isInteger(Number(team_id)) || !Array.isArray(player_ids)) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [captains] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT 1 FROM team_members WHERE user_id = ? AND team_id = ? AND role = 'captain'`,
        [userId, Number(team_id)]
      );

      if (captains.length === 0) {
        res.status(403).json({ success: false, message: "Only captain can set match players" });
        return;
      }

      for (const playerId of player_ids) {
        const [members] = await dbRes.conn.execute<RowDataPacket[]>(
          `SELECT 1 FROM team_members WHERE user_id = ? AND team_id = ?`,
          [playerId, Number(team_id)]
        );

        if (members.length > 0) {
          await dbRes.conn.execute(
            `INSERT INTO match_players (match_id, user_id, team_id, performance_notes)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE performance_notes = VALUES(performance_notes), team_id = VALUES(team_id)`,
            [matchId, playerId, Number(team_id), performance_notes ?? null]
          );
        }
      }

      res.status(200).json({ success: true, message: "Match players saved" });
    } finally {
      dbRes.conn.release();
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
