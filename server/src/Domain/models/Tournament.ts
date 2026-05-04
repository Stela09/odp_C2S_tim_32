export class Tournament{
    constructor(
        public id: number = 0,
        public game_id: number = 0, 
        public name: string = "",
        public format: "single_elimination" | "double_elimination" | "round_robin" = "single_elimination",
        public max_teams: number = 0,
        public registration_deadline: Date = new Date(),
        public starts_at: Date = new Date(),
        public prize_pool: number | null = null,
        public status: "upcoming" | "activate" | "completed" | "cancelled" = "upcoming",
        public created_at: Date = new Date(),
    ) { }
}