import { UserRole } from "../enums/UserRole";
export type JwtPayload = {
  id: number;
  gamer_tag: string;
  role: UserRole;
};
