import { Request, Response, Router } from "express";
import { RowDataPacket } from "mysql2";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { AuditRepository } from "../../Database/repositories/audit/AuditRepository";

export class TournamentRegistrationController {
  private readonly router = Router();

  public constructor(
    private readonly db: DbManager,
    private readonly auditRepo?: AuditRepository
  ) {
    this.router.post("/tournaments/:id/register", authenticate, this.registerTeam.bind(this));
  }

  private async registerTeam(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const tournamentId = Number(req.params.id);
    const teamId = Number(req.body.teamId);

    if (!userId || !Number.isInteger(tournamentId) || !Number.isInteger(teamId)) {
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
        `SELECT 1 FROM team_members
         WHERE user_id = ? AND team_id = ? AND role = 'captain'`,
        [userId, teamId]
      );

      if (captains.length === 0) {
        res.status(403).json({ success: false, message: "Samo kapiten može prijaviti tim" });
        return;
      }

      const [tournaments] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT registration_deadline FROM tournaments WHERE id = ?`,
        [tournamentId]
      );

      if (tournaments.length === 0) {
        res.status(404).json({ success: false, message: "Tournament not found" });
        return;
      }

      if (new Date(tournaments[0].registration_deadline) < new Date()) {
        res.status(400).json({ success: false, message: "Rok za prijavu je istekao" });
        return;
      }

      await dbRes.conn.execute(
        `INSERT INTO tournament_registrations (team_id, tournament_id, status)
         VALUES (?, ?, 'pending')`,
        [teamId, tournamentId]
      );

      await this.auditRepo?.log(userId, "REGISTER_TEAM", "tournament", tournamentId);
      res.status(201).json({ success: true, message: "Tim je prijavljen na turnir" });
    } catch {
      res.status(409).json({ success: false, message: "Tim je već prijavljen ili prijava nije uspela" });
    } finally {
      dbRes.conn.release();
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
