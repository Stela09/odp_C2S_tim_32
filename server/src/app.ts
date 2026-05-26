import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

import { ConsoleLoggerService } from "./Services/logger/ConsoleLoggerService";
import { DbManager } from "./Database/connection/DbConnectionPool";

import { UserRepository } from "./Database/repositories/users/UserRepository";
import { EntityRepository } from "./Database/repositories/entity/EntityRepository";

import { AuthService } from "./Services/auth/AuthService";
import { UserService } from "./Services/users/UserService";
import { EntityService } from "./Services/entity/EntityService";

import { AuthController } from "./WebAPI/controllers/AuthController";
import { UserController } from "./WebAPI/controllers/UserController";
import { EntityController } from "./WebAPI/controllers/EntityController";

import { TeamController } from "./WebAPI/controllers/TeamController";
import { WatchlistController } from "./WebAPI/controllers/WatchlistController";
import { TournamentRegistrationController } from "./WebAPI/controllers/TournamentRegistrationController";
import { HealthController } from "./WebAPI/controllers/HealthController";
import { AuditController } from "./WebAPI/controllers/AuditController";

export const logger = new ConsoleLoggerService();
export const db = new DbManager(logger);

const userRepo = new UserRepository(db, logger);
const entityRepo = new EntityRepository(db, logger);

const authService = new AuthService(userRepo);
const userService = new UserService(userRepo);
const entityService = new EntityService(entityRepo);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL ?? "*" }));
app.use(express.json());

app.post("/api/v1/auth/register", async (req, res) => {
  const { gamer_tag, full_name, email, password, profile_image } = req.body;

  if (!gamer_tag || !full_name || !email || !password) {
    res.status(400).json({ success: false, message: "Sva polja su obavezna" });
    return;
  }

  const result = await authService.register(
    gamer_tag,
    full_name,
    email,
    password,
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
});

app.post("/api/v1/auth/login", async (req, res) => {
  const { gamer_tag, password } = req.body;

  if (!gamer_tag || !password) {
    res.status(400).json({
      success: false,
      message: "Gamer tag i lozinka su obavezni",
    });
    return;
  }

  const result = await authService.login(gamer_tag, password);

  if (result.id === 0) {
    res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
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
});

app.use("/api/v1", new AuthController(authService).getRouter());
app.use("/api/v1", new UserController(userService).getRouter());
app.use("/api/v1", new EntityController(entityService).getRouter());

app.use("/api/v1", new TeamController(db).getRouter());
app.use("/api/v1", new WatchlistController(db).getRouter());
app.use("/api/v1", new TournamentRegistrationController(db).getRouter());
app.use("/api/v1", new HealthController(db).getRouter());
app.use("/api/v1", new AuditController(db).getRouter());

export default app;