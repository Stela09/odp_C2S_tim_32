import { Tournament } from '../models/Tournament';
import { User } from '../models/User';

const TOURNAMENT_KEY = "pulse_grid_tournaments";
const USER_KEY = "pulse_grid_user";

export const storageService = {

    getTournaments: ():Tournament[] => {
        const data = localStorage.getItem(TOURNAMENT_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveTournaments: (tournaments: Tournament[]): void => {
        localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(tournaments));
    },

    addTournament: (tournament: Tournament): void => {
        const all = storageService.getTournaments();
        all.push(tournament);
        storageService.saveTournaments(all);
    },

    setCurrentUser: (user: User): void =>{
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getCurrentUser: (): User | null => {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    cleanStorage: (): void => {
        localStorage.removeItem(USER_KEY);
    }
}