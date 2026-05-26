import { RowDataPacket, ResultSetHeader } from "mysql2";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class WatchlistRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  async add(userId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      await res.conn.execute<ResultSetHeader>(
        `INSERT IGNORE INTO user_watchlist (user_id, tournament_id) VALUES (?, ?)`,
        [userId, tournamentId]
      );
      return true;
    } catch (err) {
      this.logger.error("WatchlistRepository", "add failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async remove(userId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      await res.conn.execute<ResultSetHeader>(
        `DELETE FROM user_watchlist WHERE user_id = ? AND tournament_id = ?`,
        [userId, tournamentId]
      );
      return true;
    } catch (err) {
      this.logger.error("WatchlistRepository", "remove failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async getByUserId(userId: number): Promise<RowDataPacket[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT t.* FROM tournaments t
         INNER JOIN user_watchlist uw ON uw.tournament_id = t.id
         WHERE uw.user_id = ?
         ORDER BY uw.added_at DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      this.logger.error("WatchlistRepository", "getByUserId failed", err);
      return [];
    } finally { res.conn.release(); }
  }
}