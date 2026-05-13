import { UserRole } from "../../enums/UserRole";

export class UserDto {
  constructor(
    public id: number                   = 0,
    public gamer_tag: string            = "",
    public full_name: string            = "",
    public email: string                = "",
    public role: UserRole               = UserRole.USER,
    public profile_image: string | null = null,
    public created_at: Date             = new Date(),
  ) {}
}
