import { UserRole } from "../../enums/UserRole";

export class AuthUserDto {
  constructor(
    public id: number       = 0,
    public gamer_tag: string = "",
    public role: UserRole   = UserRole.PLAYER,
  ) {}
}
