import { RowDataPacket, ResultSetHeader } from "mysql2";
import { IUserRepository } from "../../../Domain/repositories/users/IUserRepository";
import { User } from "../../../Domain/models/User";
import { UserDto } from "../../../Domain/DTOs/users/UserDto";
import { UserRole } from "../../../Domain/enums/UserRole";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class UserRepository implements IUserRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  private map(r: RowDataPacket): User {
    return new User(r.id, r.gamer_tag, r.full_name, r.email, r.password_hash,
      r.profile_image, r.role as UserRole, new Date(r.created_at));
  }

  private mapDto(r: RowDataPacket): UserDto {
    return new UserDto(r.id, r.gamer_tag, r.full_name, r.email,
      r.role as UserRole, r.profile_image, new Date(r.created_at));
  }

  async create(user: User): Promise<User> {
    const res = await this.db.getWriteConnection();
    if (!res) return new User();
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `INSERT INTO users (gamer_tag, full_name, email, password_hash, profile_image, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.gamer_tag, user.full_name, user.email, user.password_hash, user.profile_image, user.role]
      );
      if (result.insertId === 0) return new User();
      return new User(result.insertId, user.gamer_tag, user.full_name, user.email,
        user.password_hash, user.profile_image, user.role);
    } catch (err) {
      this.logger.error("UserRepository", "create failed", err);
      return new User();
    } finally { res.conn.release(); }
  }

  async findById(id: number): Promise<UserDto | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE id = ?`, [id]
      );
      return rows.length > 0 ? this.mapDto(rows[0]) : null;
    } catch (err) {
      this.logger.error("UserRepository", "findById failed", err);
      return null;
    } finally { res.conn.release(); }
  }

  async findByGamerTag(gamerTag: string): Promise<User | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE gamer_tag = ?`, [gamerTag]
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("UserRepository", "findByGamerTag failed", err);
      return null;
    } finally { res.conn.release(); }
  }

  async findByEmail(email: string): Promise<User | null> {
    const res = await this.db.getReadConnection();
    if (!res) return null;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users WHERE email = ?`, [email]
      );
      return rows.length > 0 ? this.map(rows[0]) : null;
    } catch (err) {
      this.logger.error("UserRepository", "findByEmail failed", err);
      return null;
    } finally { res.conn.release(); }
  }

  async findAll(): Promise<UserDto[]> {
    const res = await this.db.getReadConnection();
    if (!res) return [];
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT * FROM users ORDER BY created_at DESC`
      );
      return rows.map((r) => this.mapDto(r));
    } catch (err) {
      this.logger.error("UserRepository", "findAll failed", err);
      return [];
    } finally { res.conn.release(); }
  }

  async update(id: number, fields: Partial<User>): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
      if (entries.length === 0) return false;
      const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
      const values = entries.map(([, v]) => v);
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("UserRepository", "update failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async updateRole(id: number, role: string): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;
    try {
      const [result] = await res.conn.execute<ResultSetHeader>(
        `UPDATE users SET role = ? WHERE id = ?`, [role, id]
      );
      return result.affectedRows > 0;
    } catch (err) {
      this.logger.error("UserRepository", "updateRole failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.db.getWriteConnection();
    if (!res) return false;

    try {
      await res.conn.beginTransaction();

      const [captainTeams] = await res.conn.execute<RowDataPacket[]>(
        `SELECT team_id FROM team_members WHERE user_id = ? AND role = 'captain'`,
        [id]
      );

      for (const team of captainTeams) {
        const teamId = Number(team.team_id);
        const [replacementRows] = await res.conn.execute<RowDataPacket[]>(
          `SELECT user_id
           FROM team_members
           WHERE team_id = ? AND user_id <> ?
           ORDER BY joined_at ASC
           LIMIT 1`,
          [teamId, id]
        );

        if (replacementRows.length > 0) {
          await res.conn.execute(
            `UPDATE team_members SET role = 'captain' WHERE team_id = ? AND user_id = ?`,
            [teamId, replacementRows[0].user_id]
          );
        } else {
          await res.conn.execute(`DELETE FROM teams WHERE id = ?`, [teamId]);
        }
      }

      const [result] = await res.conn.execute<ResultSetHeader>(
        `DELETE FROM users WHERE id = ?`,
        [id]
      );

      await res.conn.commit();
      return result.affectedRows > 0;
    } catch (err) {
      await res.conn.rollback();
      this.logger.error("UserRepository", "delete failed", err);
      return false;
    } finally { res.conn.release(); }
  }

  async exists(id: number): Promise<boolean> {
    const res = await this.db.getReadConnection();
    if (!res) return false;
    try {
      const [rows] = await res.conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM users WHERE id = ?`, [id]
      );
      return (rows[0]?.cnt ?? 0) > 0;
    } catch (err) {
      this.logger.error("UserRepository", "exists failed", err);
      return false;
    } finally { res.conn.release(); }
  }
}
