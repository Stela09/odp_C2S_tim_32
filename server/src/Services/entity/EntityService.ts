import { IEntityService } from "../../Domain/services/entity/IEntityService";
import { IEntityRepository } from "../../Domain/repositories/entity/IEntityRepository";
import { EntityDto } from "../../Domain/DTOs/entity/EntityDto";
import { CreateEntityDto } from "../../Domain/DTOs/entity/CreateEntityDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { EntityStatus } from "../../Domain/enums/EntityStatus";

export class EntityService implements IEntityService {
  public constructor(private readonly entityRepo: IEntityRepository) {}

  async getAll(page = 1, limit = 20): Promise<PaginatedListDto<EntityDto>> {
    const items = await this.entityRepo.findAll(page, limit);
    return new PaginatedListDto(items, items.length, page, limit);
  }

  async getById(id: number): Promise<EntityDto | null> {
    return this.entityRepo.findById(id);
  }

  async getByGameId(gameId: number): Promise<EntityDto[]> {
    return this.entityRepo.findByGameId(gameId);
  }

  async getByStatus(status: string): Promise<EntityDto[]> {
    return this.entityRepo.findByStatus(status);
  }

  async create(dto: CreateEntityDto): Promise<EntityDto | null> {
    const created = await this.entityRepo.create(dto);
    if (created.id === 0) return null;
    return new EntityDto(
      created.id, dto.game_id, dto.name, dto.format, dto.max_teams,
      dto.registration_deadline, dto.starts_at, dto.prize_pool ?? null,
      EntityStatus.UPCOMING, new Date()
    );
  }

  async update(id: number, fields: Partial<EntityDto>): Promise<boolean> {
    return this.entityRepo.update(id, fields);
  }

  async delete(id: number): Promise<boolean> {
    return this.entityRepo.delete(id);
  }
}