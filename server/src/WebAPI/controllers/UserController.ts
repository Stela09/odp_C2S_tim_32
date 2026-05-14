import { Request, Response, Router } from "express";
import { IUserService } from "../../Domain/services/users/IUserService";
import { authenticate } from "../../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../../Middlewares/authorization/AuthorizeMiddleware";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserController {
  private readonly router = Router();

  public constructor(private readonly userService: IUserService) {
    this.router.get("/users",          authenticate, authorize(UserRole.ADMIN), this.getAll.bind(this));
    this.router.get("/users/:id",      this.getById.bind(this));
    this.router.patch("/users/:id/role", authenticate, authorize(UserRole.ADMIN), this.updateRole.bind(this));
  }

  private async getAll(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAll();
    res.status(200).json({ success: true, data: users });
  }

  private async getById(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const user = await this.userService.getById(id);
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({ success: true, data: user });
  }

  private async updateRole(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) { res.status(400).json({ success: false, message: "Invalid id" }); return; }
    const { role } = req.body as { role?: string };
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }
    const ok = await this.userService.updateRole(id, role);
    res.status(ok ? 200 : 500).json({ success: ok, message: ok ? "Role updated" : "Failed to update role" });
  }

  public getRouter(): Router { return this.router; }
}
