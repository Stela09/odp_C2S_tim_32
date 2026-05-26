import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { ValidationResult } from "../../Domain/types/ValidationResult";
import { validateLogin } from "../validators/auth/validateLogin";
import { validateRegister } from "../validators/auth/validateRegister";

export class AuthController {
  private readonly router = Router();

  public constructor(private readonly authService: IAuthService) {
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
    const { gamer_tag, password } = req.body as {
      gamer_tag?: string;
      password?: string;
    };

    const v: ValidationResult = validateLogin(gamer_tag ?? "", password ?? "");
    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const result = await this.authService.login(gamer_tag!, password!);

    if (result.id === 0) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    const token = jwt.sign(
      { id: result.id, gamer_tag: result.gamer_tag, role: result.role },
      process.env.JWT_SECRET || "pulse_grid_secret_123",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: token,
    });
  }

  private async register(req: Request, res: Response): Promise<void> {
    const { gamer_tag, full_name, email, password, profile_image } = req.body as {
      gamer_tag?: string;
      full_name?: string;
      email?: string;
      password?: string;
      profile_image?: string;
    };

    const v: ValidationResult = validateRegister(
      gamer_tag ?? "",
      full_name ?? "",
      email ?? "",
      password ?? ""
    );

    if (!v.valid) {
      res.status(400).json({ success: false, message: v.message });
      return;
    }

    const result = await this.authService.register(
      gamer_tag!,
      full_name!,
      email!,
      password!,
      profile_image ?? null
    );

    if (result.id === 0) {
      res.status(409).json({
        success: false,
        message: "Gamer tag or email already taken",
      });
      return;
    }

    const token = jwt.sign(
      { id: result.id, gamer_tag: result.gamer_tag, role: result.role },
      process.env.JWT_SECRET || "pulse_grid_secret_123",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: token,
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}