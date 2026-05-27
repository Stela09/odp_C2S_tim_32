import { UserDto } from "../../DTOs/users/UserDto";

export interface IUserService {
  getAll(): Promise<UserDto[]>;
  getById(id: number): Promise<UserDto | null>;
  updateRole(id: number, role: string): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
