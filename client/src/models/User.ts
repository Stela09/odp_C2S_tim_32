import { UserRole } from "../enums/UserRole";

export interface User {
  id: number;
  gamer_tag: string;
  full_name: string;
  email: string;
  password_hash: string;
  profile_image: string | null;
  role: UserRole;
  created_at: Date;
}