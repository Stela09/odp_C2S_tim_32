// client/src/models/Tournament.ts

export class Tournament{
    public id: number;
    public game_id: number;
    public name: string;
    public format: "single_elimination" | "double_elimination" | "round_robin";
    public max_teams: number;
    public registration_deadline: Date;
    public starts_at: Date;
    public prize_pool: number | null;
    public status: "upcoming" | "activate" | "completed" | "cancelled";
    public created_at: Date;

    constructor() {
        this.id = 0;
        this.game_id = 0;
        this.name = "";
        this.format = "single_elimination";
        this.max_teams = 0;
        this.registration_deadline = new Date();
        this.starts_at = new Date();
        this.prize_pool = null;
        this.status = "upcoming";
        this.created_at = new Date();
    }
}