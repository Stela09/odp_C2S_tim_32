import { Request, Response, Router } from "express";
import { RowDataPacket } from "mysql2";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class AuditController {
  private readonly router = Router();

  public constructor(private readonly db: DbManager) {
    this.router.get("/audits/logs", authenticate, authorize(UserRole.ADMIN), this.getLogs.bind(this));
  }

  private async getLogs(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const offset = (page - 1) * limit;

    const dbRes = await this.db.getReadConnection();
    if (!dbRes) {
      res.status(500).json({ success: false, message: "Database unavailable" });
      return;
    }

    try {
      const [rows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT al.*, u.gamer_tag
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`
      );

      const [countRows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM audit_logs`
      );

      res.status(200).json({
        success: true,
        data: {
          items: rows,
          total: Number(countRows[0]?.total ?? 0),
          page,
          limit,
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
