import { Request, Response, Router } from "express";
import { RowDataPacket } from "mysql2";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";

export class WatchlistController {
  private readonly router = Router();

  public constructor(private readonly db: DbManager) {
    this.router.get("/watchlist", authenticate, this.getWatchlist.bind(this));
    this.router.post("/tournaments/:id/watch", authenticate, this.watch.bind(this));
    this.router.delete("/tournaments/:id/watch", authenticate, this.unwatch.bind(this));
  }

  private async getWatchlist(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const dbRes = await this.db.getReadConnection();

    if (!userId || !dbRes) {
      res.status(500).json({ success: false, message: "Request failed" });
      return;
    }

    try {
      const [rows] = await dbRes.conn.execute<RowDataPacket[]>(
        `SELECT t.*
         FROM user_watchlist uw
         JOIN tournaments t ON t.id = uw.tournament_id
         WHERE uw.user_id = ?
         ORDER BY uw.added_at DESC`,
        [userId]
      );

      res.status(200).json({ success: true, data: rows });
    } finally {
      dbRes.conn.release();
    }
  }

  private async watch(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const tournamentId = Number(req.params.id);
    const dbRes = await this.db.getWriteConnection();

    if (!userId || !Number.isInteger(tournamentId) || !dbRes) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }

    try {
      await dbRes.conn.execute(
        `INSERT IGNORE INTO user_watchlist (user_id, tournament_id)
         VALUES (?, ?)`,
        [userId, tournamentId]
      );

      res.status(200).json({ success: true, message: "Tournament added to watchlist" });
    } finally {
      dbRes.conn.release();
    }
  }

  private async unwatch(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const tournamentId = Number(req.params.id);
    const dbRes = await this.db.getWriteConnection();

    if (!userId || !Number.isInteger(tournamentId) || !dbRes) {
      res.status(400).json({ success: false, message: "Invalid request" });
      return;
    }

    try {
      await dbRes.conn.execute(
        `DELETE FROM user_watchlist WHERE user_id = ? AND tournament_id = ?`,
        [userId, tournamentId]
      );

      res.status(200).json({ success: true, message: "Tournament removed from watchlist" });
    } finally {
      dbRes.conn.release();
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}