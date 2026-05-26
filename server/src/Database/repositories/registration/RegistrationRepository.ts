import { RowDataPacket, ResultSetHeader } from "mysql2";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class RegistrationRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  async register(teamId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      await res.conn.execute<ResultSetHeader>(
        `INSERT INTO tournament_registrations (team_id, tournament_id) VALUES (?, ?)`,
        [teamId, tournamentId]
      );
      return true;
    } catch (err) {
      this.logger.error("RegistrationRepository", "register failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async unregister(teamId: number, tournamentId: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      await res.conn.execute<ResultSetHeader>(
        `DELETE FROM tournament_registrations WHERE team_id = ? AND tournament_id = ?`,
        [teamId, tournamentId]
      );
      return true;
    } catch (err) {
      this.logger.error("RegistrationRepository", "unregister failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async getByTournamentId(tournamentId: number): Promise<RowDataPacket[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT tr.*, t.name as team_name, t.tag FROM tournament_registrations tr
         INNER JOIN teams t ON t.id = tr.team_id
         WHERE tr.tournament_id = ?`,
        [tournamentId]
      );
      return rows;
    } catch (err) {
      this.logger.error("RegistrationRepository", "getByTournamentId failed", err);
      return [];
    } finally { res.conn.release(); }
  }
}