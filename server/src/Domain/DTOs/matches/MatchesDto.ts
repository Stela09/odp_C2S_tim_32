export class MatchesDto{
    constructor(
        public id: number                  = 0,
        public tournament_id: number       = 0,
        public team1_id: number            = 0,
        public team2_id: number            = 0,
        public winner_id: number           = 0,
        public score: string | null        = null,
        public round: number               = 0,
        public status: "scheduled" | "ongoing" | "completed" = "scheduled",
        public scheduled_at: Date          = new Date(),
    ) {}
}