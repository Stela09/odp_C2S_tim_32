import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { UserDto } from "../../Domain/DTOs/users/UserDto";

export class UserService implements IUserService {
  public constructor(private readonly userRepo: IUserRepository) {}

  async getAll(): Promise<UserDto[]> {
    return this.userRepo.findAll();
  }

  async getById(id: number): Promise<UserDto | null> {
    return this.userRepo.findById(id);
  }

  async updateRole(id: number, role: string): Promise<boolean> {
    return this.userRepo.updateRole(id, role);
  }
}
