import bcrypt from "bcryptjs";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { AuthUserDto } from "../../Domain/DTOs/auth/AuthUserDto";
import { UserRole } from "../../Domain/enums/UserRole";
import { User } from "../../Domain/models/User";

export class AuthService implements IAuthService {
  private readonly saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);

  public constructor(private readonly userRepo: IUserRepository) {}

  async login(gamer_tag: string, password: string): Promise<AuthUserDto> {
    const user = await this.userRepo.findByGamerTag(gamer_tag);
    if (!user || user.id === 0) return new AuthUserDto();
    const match = await bcrypt.compare(password, user.password_hash).catch(() => false);
    if (!match) return new AuthUserDto();
    return new AuthUserDto(user.id, user.gamer_tag, user.role);
  }

  async register(gamer_tag: string, full_name: string, email: string, password: string, profile_image: string | null = null): Promise<AuthUserDto> {
    const byTag = await this.userRepo.findByGamerTag(gamer_tag);
    if (byTag && byTag.id !== 0) return new AuthUserDto();
    const byEmail = await this.userRepo.findByEmail(email);
    if (byEmail && byEmail.id !== 0) return new AuthUserDto();
    const hash = await bcrypt.hash(password, this.saltRounds).catch(() => "");
    if (!hash) return new AuthUserDto();
    const created = await this.userRepo.create(
      new User(0, gamer_tag, full_name, email, hash, profile_image)
    );
    if (created.id === 0) return new AuthUserDto();
    return new AuthUserDto(created.id, created.gamer_tag, created.role);
  }
}
