import { Request, Response, Router } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { AuditRepository } from "../../Database/repositories/audit/AuditRepository";

export class TeamController {
  private readonly router = Router();

  public constructor(
    private readonly db: DbManager,
    private readonly auditRepo?: AuditRepository
  ) {
    this.router.get("/teams", authenticate, this.getMyTeams.bind(this));
    this.router.post("/teams", authenticate, this.create.bind(this));
    this.router.get("/teams/:id", this.getById.bind(this));
  }

  private async getMembers(teamId: number) {
    const res = await this.db.getReadConnection();
    if (!res) return [];

    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT u.id, u.gamer_tag, tm.role
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = ?
         ORDER BY tm.role ASC, u.gamer_tag ASC`,
        [teamId]
      );

      return rows;
    } finally {
      res.conn.release();
    }
  }

  private async getMyTeams(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    const dbRes = await this.db.getReadConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [teams] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT t.*
         FROM teams t
         JOIN team_members tm ON tm.team_id = t.id
         WHERE tm.user_id = ?
         ORDER BY t.created_at DESC`,
        [userId]
      );

      const data = [];
      for (const team of teams) {
        data.push({
          ...team,
          members: await this.getMembers(Number(team.id)),
        });
      }

      res.status(200).json({ success: true, data });
    } finally {
      dbRes.conn.release();
    }
  }

  private async create(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { name, tag, logo, description } = req.body as {
      name?: string;
      tag?: string;
      logo?: string;
      description?: string;
    };

    if (!userId) {
      res.status(401).json({ success: false, message: "Missing user" });
      return;
    }

    if (!name || name.trim().length < 2 || !tag || tag.trim().length < 2 || tag.length > 6) {
      res.status(400).json({ success: false, message: "Naziv i tag nisu ispravni" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      await dbRes.conn.beginTransaction();

      const [result] = await dbRes.conn.execute<ResultSetHeader>(
        `INSERT INTO teams (name, tag, logo, description)
         VALUES (?, ?, ?, ?)`,
        [name.trim(), tag.trim().toUpperCase(), logo ?? null, description ?? null]
      );

      await dbRes.conn.execute(
        `INSERT INTO team_members (user_id, team_id, role)
         VALUES (?, ?, 'captain')`,
        [userId, result.insertId]
      );

      await dbRes.conn.commit();
      await this.auditRepo?.log(userId, "CREATE_TEAM", "team", result.insertId);

      res.status(201).json({
        success: true,
        data: { id: result.insertId, name, tag: tag.toUpperCase(), description: description ?? null },
      });
    } catch {
      await dbRes.conn.rollback();
      res.status(500).json({ success: false, message: "Greška pri kreiranju tima" });
    } finally {
      dbRes.conn.release();
    }
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid team id" });
      return;
    }

    const dbRes = await this.db.getReadConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [rows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT * FROM teams WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: "Team not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...rows[0],
          members: await this.getMembers(id),
        },
      });
    } finally {
      dbRes.conn.release();
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
