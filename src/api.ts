import { Corridor } from "./types";

let DB: Corridor[] = [];

export const api = {
  async list(): Promise<Corridor[]> {
    return structuredClone(DB);
  },

  async create(corridor: Corridor) {
    DB.push(corridor);
  },

  async update(corridor: Corridor) {
    DB = DB.map(c => (c.id === corridor.id ? corridor : c));
  },

  async remove(id: string) {
    DB = DB.filter(c => c.id !== id);
  },
};

