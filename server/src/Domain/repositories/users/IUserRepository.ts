import { User } from "../../models/User";
import { UserDto } from "../../DTOs/users/UserDto";

export interface IUserRepository {
  findById(id: number): Promise<UserDto | null>;
  findByGamerTag(gamer_tag: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<UserDto[]>;
  create(user: User): Promise<User>;
  update(id: number, fields: Partial<User>): Promise<boolean>;
  updateRole(id: number, role: string): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
