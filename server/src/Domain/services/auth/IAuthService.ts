import { AuthUserDto } from "../../DTOs/auth/AuthUserDto";

export interface IAuthService {
  login(gamer_tag: string, password: string): Promise<AuthUserDto>;
  register(gamer_tag: string, full_name: string, email: string, password: string, profile_image?: string | null): Promise<AuthUserDto>;
}
