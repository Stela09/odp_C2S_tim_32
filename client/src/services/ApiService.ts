const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export const apiService = {

  async login(gamer_tag: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gamer_tag, password }),
    });
    return res.json();
  },

  async register(gamer_tag: string, full_name: string, email: string, password: string, profile_image?: string | null) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gamer_tag, full_name, email, password, profile_image }),
    });
    return res.json();
  },

  async getTournaments(page = 1, limit = 20) {
    const res = await fetch(`${API_URL}/tournaments?page=${page}&limit=${limit}`);
    return res.json();
  },

  async getTournamentById(id: number) {
    const res = await fetch(`${API_URL}/tournaments/${id}`);
    return res.json();
  },

  async getUsers(token: string) {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateUserRole(id: number, role: string, token: string) {
    const res = await fetch(`${API_URL}/users/${id}/role`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },

   async getMyTeams(token: string) {
    const res = await fetch(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async createTeam(name: string, tag: string, description: string, token: string) {
    const res = await fetch(`${API_URL}/teams`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name, tag, description }),
    });
    return res.json();
  },

  async createTournament(data: object, token: string) {
    const res = await fetch(`${API_URL}/tournaments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getDbHealth(token: string) {
    const res = await fetch(`${API_URL}/health/db`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getApiHealth(token: string) {
    const res = await fetch(`${API_URL}/health/api`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getAuditLogs(token: string, page = 1, limit = 20) {
    const res = await fetch(`${API_URL}/audits/logs?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async watchTournament(tournamentId: number, token: string) {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/watch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async unwatchTournament(tournamentId: number, token: string) {
    const res = await fetch(`${API_URL}/tournaments/${tournamentId}/watch`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getWatchlist(token: string) {
    const res = await fetch(`${API_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async registerTeamToTournament(tournamentId: number, teamId: number, token: string) {
  const res = await fetch(`${API_URL}/tournaments/${tournamentId}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ teamId }),
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: `Server nije vratio JSON. Status: ${res.status}. Odgovor: ${text}`,
    };
  }
},

  async getTeamById(teamId: number) {
    const res = await fetch(`${API_URL}/teams/${teamId}`);
    return res.json();
  },

};
