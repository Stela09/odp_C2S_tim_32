export class Game{
    constructor(
        public id: number                   = 0,
        public name: string                 = "",
        public logo: string                 | null = null,
        public genre: string         | null = null,
        public max_players_per_team: string | null = null,
        public created_at: Date             = new Date(),
    ) { }
}