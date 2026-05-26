import { Request, Response, Router } from "express";
import { DbManager } from "../../Database/connection/DbConnectionPool";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class HealthController {
  private readonly router = Router();

  public constructor(private readonly db: DbManager) {
    this.router.get("/health/check", this.check.bind(this));
    this.router.get("/health/db", authenticate, authorize(UserRole.ADMIN), this.dbHealth.bind(this));
    this.router.get("/health/api", authenticate, authorize(UserRole.ADMIN), this.apiHealth.bind(this));
  }

  private check(req: Request, res: Response): void {
    res.status(200).json({ success: true, status: "healthy" });
  }

  private dbHealth(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: this.db.getNodes(),
    });
  }

  private apiHealth(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: [
        {
          name: "api-1",
          status: "healthy",
          port: Number(process.env.PORT ?? 4000),
          latency: 0,
        },
      ],
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}