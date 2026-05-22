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
};