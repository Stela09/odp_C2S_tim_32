export class Game{

    public id: number;
    public name: string;
    public logo: string | null;
    public genre: string | null;
    public max_players_per_team: string | null;
    public created_at: Date;

    constructor() 
    { 
        this.id= 0;
        this.name = "";
        this.logo = null;
        this.genre = null;
        this.max_players_per_team = null;
        this.created_at = new Date();
    }
}