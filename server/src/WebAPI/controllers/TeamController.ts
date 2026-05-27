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
    this.router.get("/teams/invitations", authenticate, this.getMyInvitations.bind(this));
    this.router.post("/teams/:id/invite", authenticate, this.invite.bind(this));
    this.router.post("/teams/:id/invite/respond", authenticate, this.respondToInvite.bind(this));
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

  private async getMyInvitations(req: Request, res: Response): Promise<void> {
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
      const [rows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT ti.id, ti.team_id, ti.status, ti.created_at,
                t.name AS team_name, t.tag AS team_tag,
                u.gamer_tag AS invited_by
         FROM team_invitations ti
         JOIN teams t ON t.id = ti.team_id
         JOIN users u ON u.id = ti.invited_by_user_id
         WHERE ti.invited_user_id = ? AND ti.status = 'pending'
         ORDER BY ti.created_at DESC`,
        [userId]
      );

      res.status(200).json({ success: true, data: rows });
    } finally {
      dbRes.conn.release();
    }
  }

  private async invite(req: Request, res: Response): Promise<void> {
    const captainId = req.user?.id;
    const teamId = Number(req.params.id);
    const { gamer_tag } = req.body as { gamer_tag?: string };

    if (!captainId || !Number.isInteger(teamId) || !gamer_tag?.trim()) {
      res.status(400).json({ success: false, message: "Neispravna pozivnica" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      await dbRes.conn.beginTransaction();

      const [captainRows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'captain'`,
        [teamId, captainId]
      );
      if (captainRows.length === 0) {
        await dbRes.conn.rollback();
        res.status(403).json({ success: false, message: "Samo kapiten moze slati pozivnice" });
        return;
      }

      const [users] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT id FROM users WHERE gamer_tag = ?`,
        [gamer_tag.trim()]
      );
      if (users.length === 0) {
        await dbRes.conn.rollback();
        res.status(404).json({ success: false, message: "Korisnik nije pronadjen" });
        return;
      }

      const invitedUserId = Number(users[0].id);
      const [memberRows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
        [teamId, invitedUserId]
      );
      if (memberRows.length > 0) {
        await dbRes.conn.rollback();
        res.status(409).json({ success: false, message: "Korisnik je vec clan tima" });
        return;
      }

      const [pendingRows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT 1 FROM team_invitations
         WHERE team_id = ? AND invited_user_id = ? AND status = 'pending'`,
        [teamId, invitedUserId]
      );
      if (pendingRows.length > 0) {
        await dbRes.conn.rollback();
        res.status(409).json({ success: false, message: "Pozivnica je vec poslata" });
        return;
      }

      const [result] = await dbRes.conn.execute<ResultSetHeader>(
        `INSERT INTO team_invitations (team_id, invited_user_id, invited_by_user_id)
         VALUES (?, ?, ?)`,
        [teamId, invitedUserId, captainId]
      );

      await dbRes.conn.commit();
      await this.auditRepo?.log(captainId, "INVITE_TEAM_MEMBER", "team", teamId);
      res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch {
      await dbRes.conn.rollback();
      res.status(500).json({ success: false, message: "Greska pri slanju pozivnice" });
    } finally {
      dbRes.conn.release();
    }
  }

  private async respondToInvite(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const teamId = Number(req.params.id);
    const { invitation_id, action } = req.body as { invitation_id?: number; action?: string };

    if (!userId || !Number.isInteger(teamId) || !Number.isInteger(Number(invitation_id))) {
      res.status(400).json({ success: false, message: "Neispravan odgovor na pozivnicu" });
      return;
    }

    if (action !== "accept" && action !== "decline") {
      res.status(400).json({ success: false, message: "Akcija mora biti accept ili decline" });
      return;
    }

    const dbRes = await this.db.getWriteConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      await dbRes.conn.beginTransaction();

      const [inviteRows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT id FROM team_invitations
         WHERE id = ? AND team_id = ? AND invited_user_id = ? AND status = 'pending'`,
        [Number(invitation_id), teamId, userId]
      );
      if (inviteRows.length === 0) {
        await dbRes.conn.rollback();
        res.status(404).json({ success: false, message: "Pozivnica nije pronadjena" });
        return;
      }

      if (action === "accept") {
        await dbRes.conn.execute(
          `INSERT IGNORE INTO team_members (user_id, team_id, role)
           VALUES (?, ?, 'member')`,
          [userId, teamId]
        );
      }

      await dbRes.conn.execute(
        `UPDATE team_invitations
         SET status = ?, responded_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [action === "accept" ? "accepted" : "declined", Number(invitation_id)]
      );

      await dbRes.conn.commit();
      await this.auditRepo?.log(userId, action === "accept" ? "ACCEPT_TEAM_INVITE" : "DECLINE_TEAM_INVITE", "team", teamId);
      res.status(200).json({ success: true, message: "Pozivnica je obradjena" });
    } catch {
      await dbRes.conn.rollback();
      res.status(500).json({ success: false, message: "Greska pri obradi pozivnice" });
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
