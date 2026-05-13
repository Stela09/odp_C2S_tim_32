export class TeamDto{
    constructor(
        public id: number                  = 0,
        public name: string                = "",
        public tag: string                 = "",
        public logo: string | null         = null,
        public description: string | null  = null,
        public created_at: Date            = new Date(),
    ) {}
}