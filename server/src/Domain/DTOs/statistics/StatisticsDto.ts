// TODO: Replace with statistics relevant to your domain
export class StatisticsDto {
  constructor(
    public totalTournaments: number    = 0,
    public totalTeams: number          = 0,
    public totalUsers: number          = 0,
    public totalMatches: number        = 0,
    public activateTournaments: number = 0,
  ) {}
}
