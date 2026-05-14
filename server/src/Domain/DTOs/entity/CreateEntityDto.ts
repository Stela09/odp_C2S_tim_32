// TODO: Replace with the fields needed to create your domain entity
export class CreateEntityDto {
  constructor(
    public game_id: number               = 0,
    // add your creation fields here
    public name: string                 = "",
    public format: "single_elimination" | "double_elimination" | "round_robin" = "single_elimination",
    public max_teams: number            = 0,
    public registration_deadline: Date  = new Date(),
    public starts_at: Date              = new Date(),
    public prize_pool: number | null    = null,
  ) {}
}
