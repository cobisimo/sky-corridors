import Corridor from "./models/Corridor";
import Obstacle from "./models/Obstacle";

const BASE_URL = "http://localhost:3000";

async function handleResponse(response: Response) {
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}

export const api = {
  async listCorridors(): Promise<Corridor[]> {
    const data = await fetch(`${BASE_URL}/locations?type=corridor`).then(handleResponse);
    return data.map(c => new Corridor(c.id, c.coordinates, c.width));
  },

  async createCorridor(corridor: Corridor) {
    return fetch(`${BASE_URL}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corridor),
    }).then(handleResponse);
  },

  async updateCorridor(corridor: Corridor) {
    return fetch(`${BASE_URL}/locations/${corridor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corridor),
    }).then(handleResponse);
  },

  async removeCorridor(id: string) {
    return fetch(`${BASE_URL}/locations/${id}`, {
      method: "DELETE",
    }).then(handleResponse);
  },

  async listObstacles(): Promise<Obstacle[]> {
    const data = await fetch(`${BASE_URL}/locations?type=obstacle`).then(handleResponse);
    return data.map(o => new Obstacle(o.id, o.coordinates));
  },

  async createObstacle(obstacle: Obstacle) {
    return fetch(`${BASE_URL}/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "obstacle", coordinates: obstacle.polygon.geometry.coordinates }),
    }).then(handleResponse);
  },

  async updateObstacle(obstacle: Obstacle) {
    return fetch(`${BASE_URL}/locations/${obstacle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obstacle),
    }).then(handleResponse);
  },

  async removeObstacle(id: string) {
    return fetch(`${BASE_URL}/locations/${id}`, {
      method: "DELETE",
    }).then(handleResponse);
  },
};
