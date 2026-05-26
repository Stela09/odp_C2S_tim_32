import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Team } from "../../../Domain/models/Team";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class TeamRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): Team {
    return new Team(r.id, r.name, r.tag, r.logo, r.description, new Date(r.created_at));
  }

  async findByUserId(userId: number): Promise<Team[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT t.* FROM teams t
         INNER JOIN team_members tm ON tm.team_id = t.id
         WHERE tm.user_id = ?
         ORDER BY t.createdAt DESC`,
        [userId]
      );
      return rows.map((r) => this.map(r));
    } catch (err) {
      this.logger.error("TeamsRepository", "findByUserId failed", err);
      return [];
    } finally { res.conn.release(); }
  }

  async findById(id: number): Promise<Team | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM teams WHERE id = ?`, [id]
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("TeamsRepository", "findById failed", err);
      return null;
    } finally { res.conn.release(); }
  }

  async create(name: string, tag: string, description: string | null, userId: number): Promise<Team> {
    const res = await this.db.getWriteConnection();
    if (!res) return new Team();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO teams (name, tag, description) VALUES (?, ?, ?)`,
        [name, tag, description]
      );
      if (result.insertId === 0) return new Team();
      await res.conn.execute(
        `INSERT INTO team_members (user_id, team_id, role) VALUES (?, ?, 'captain')`,
        [userId, result.insertId]
      );
      return new Team(result.insertId, name, tag, null, description);
    } catch (err) {
      this.logger.error("TeamsRepository", "create failed", err);
      return new Team();
    } finally { res.conn.release(); }
  }

  async getMembers(teamId: number): Promise<RowDataPacket[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT u.id, u.gamer_tag, tm.role FROM team_members tm
         INNER JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = ?`,
        [teamId]
      );
      return rows;
    } catch (err) {
      this.logger.error("TeamsRepository", "getMembers failed", err);
      return [];
    } finally { res.conn.release(); }
  }
}