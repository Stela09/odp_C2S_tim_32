export class CreateTeamDto{
    constructor(
        public name: string                = "",
        public tag: string                 = "",
        public logo: string | null         = null,
        public description: string | null  = null,
    ) {}
}