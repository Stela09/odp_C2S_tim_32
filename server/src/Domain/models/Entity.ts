// TODO: Replace "Entity" and its fields with your domain model
import { EntityStatus } from "../enums/EntityStatus";

export class Entity{
  constructor(
    public id: number            = 0,
    public gameId: number        = 0,
    public status: EntityStatus  = EntityStatus.UPCOMING,
    public createdAt: Date       = new Date(),
  ) {}
}
