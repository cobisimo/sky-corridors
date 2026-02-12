const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('geo_data.db');
app.use(express.json());

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NULL,
    type TEXT CHECK(type IN ('corridor', 'obstacle', 'landing_point')),
    coordinates TEXT NOT NULL,
    width REAL NULL
  )
`);

app.post('/locations', (req, res) => {
  const { name, type, coordinates } = req.body;
  const stmt = db.prepare('INSERT INTO locations (name, type, coordinates) VALUES (?, ?, ?)');
  const info = stmt.run(name, type, JSON.stringify(coordinates));
  res.status(201).json({ id: info.lastInsertRowid, message: "Location saved" });
});

app.get('/locations', (req, res) => {
  const type = req.query.type;
  const stmt = type
    ? db.prepare('SELECT * FROM locations WHERE type = ?')
    : db.prepare('SELECT * FROM locations');

  const data = stmt.all(type).map(row => ({
    ...row,
    coordinates: JSON.parse(row.coordinates)
  }));
  res.json(data);
});

app.put('/locations/:id', (req, res) => {
  const { name, coordinates } = req.body;
  const stmt = db.prepare('UPDATE locations SET name = ?, coordinates = ? WHERE id = ?');
  const info = stmt.run(name, JSON.stringify(coordinates), req.params.id);
  res.json({ updated: info.changes });
});

app.delete('/locations/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM locations WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ deleted: info.changes });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Geo Server running on http://localhost:${PORT}`));
