import { Request, Response, Router } from "express";
import { IEntityService } from "../../Domain/services/entity/IEntityService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";
import { CreateEntityDto } from "../../Domain/DTOs/entity/CreateEntityDto";

export class EntityController {
  private readonly router = Router();

  public constructor(private readonly entityService: IEntityService) {
    this.router.get("/tournaments",              this.getAll.bind(this));
    this.router.get("/tournaments/:id",          this.getById.bind(this));
    this.router.get("/tournaments/game/:gameId", this.getByGameId.bind(this));
    this.router.post("/tournaments",             authenticate, authorize(UserRole.ADMIN), this.create.bind(this));
    this.router.patch("/tournaments/:id",        authenticate, authorize(UserRole.ADMIN), this.update.bind(this));
    this.router.delete("/tournaments/:id",       authenticate, authorize(UserRole.ADMIN), this.delete.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const page   = parseInt(req.query.page  as string ?? "1",  10);
    const limit  = parseInt(req.query.limit as string ?? "20", 10);
    const status = req.query.status as string | undefined;
    if (status) {
      const items = await this.entityService.getByStatus(status);
      res.status(200).json({ success: true, data: items });
      return;
    }
    const result = await this.entityService.getAll(page, limit);
    res.status(200).json({ success: true, data: result });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const entity = await this.entityService.getById(id);
    if (!entity) { res.status(404).json({ success: false, message: "Tournament not found" }); return; }
    res.status(200).json({ success: true, data: entity });
  }

  private async getByGameId(req: Request, res: Response): Promise<void> {
    const gameId = parseInt(req.params.gameId as string, 10);
    if (isNaN(gameId)) { res.status(400).json({ success: false, message: "Invalid gameId" }); return; }
    const items = await this.entityService.getByGameId(gameId);
    res.status(200).json({ success: true, data: items });
  }

  private async create(req: Request, res: Response): Promise<void> {
    console.log("Create tournament body:", req.body);
    const { game_id, name, format, max_teams, registration_deadline, starts_at, prize_pool } = req.body;
    console.log("game_id:", game_id, typeof game_id);
    if (!game_id || !name || !format || !max_teams || !registration_deadline || !starts_at) {
      res.status(400).json({ success: false, message: "Sva obavezna polja moraju biti popunjena" });
      return;
    }
    const dto = new CreateEntityDto(
    parseInt(game_id), name, format, parseInt(max_teams),
    new Date(registration_deadline), new Date(starts_at), prize_pool ?? null);
    const created = await this.entityService.create(dto);
    console.log("Created result:", created);
    if (!created) { res.status(500).json({ success: false, message: "Failed to create tournament" }); return; }
    res.status(201).json({ success: true, data: created });
  }

  private async update(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.entityService.update(id, req.body);
    res.status(ok ? 200 : 500).json({ success: ok });
  }

  private async delete(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const ok = await this.entityService.delete(id);
    res.status(ok ? 200 : 500).json({ success: ok });
  }

  public getRouter(): Router { return this.router; }
}