import { ResultSetHeader } from "mysql2";
import { DbManager } from "../../connection/DbConnectionPool";
import { ILoggerService } from "../../../Domain/services/logger/ILoggerService";

export class AuditRepository {
  public constructor(
    private readonly db: DbManager,
    private readonly logger: ILoggerService,
  ) {}

  async log(userId: number | null, action: string, entityType?: string, entityId?: number): Promise<void> {
    const res = await this.db.getWriteConnection();
    if (!res) return;
    try {
      await res.conn.execute<ResultSetHeader>(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)`,
        [userId, action, entityType ?? null, entityId ?? null]
      );
    } catch (err) {
      this.logger.error("AuditRepository", "log failed", err);
    } finally { res.conn.release(); }
  }
}