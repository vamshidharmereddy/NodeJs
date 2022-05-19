const express = require("express");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketTeam.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

initializeDBAndServer();

// Convert To List

const convertDbObjectToResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};
// Get Players API
app.get("/players/", async (request, response) => {
  const getAllPlayers = `SELECT * FROM cricket_team;`;

  const allPlayers = await db.all(getAllPlayers);

  response.send(
    allPlayers.map((eachPlayer) => convertDbObjectToResponse(eachPlayer))
  );
});

// Add Player API
app.post("/players/", async (request, response) => {
  const playerDetails = request.body;

  const { playerName, jerseyNumber, role } = playerDetails;

  const addPlayerQuery = `
    INSERT INTO 
    cricket_team
    (
        player_name, jersey_number, role
    )
    VALUES 
    (
        '${playerName}', '${jerseyNumber}', '${role}'
    );`;

  const dbResponse = await db.run(addPlayerQuery);
  const playerId = dbResponse.lastID;
  response.send('Player Added to Team');
});
// Get Player API
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
    SELECT * 
    FROM 
    cricket_team
    WHERE 
    player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);

  response.send(convertDbObjectToResponse(player));
});

// Update Player API
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = request.body;

  const { playerName, jerseyNumber, role } = playerDetails;

  const updatePlayerQuery = `
    UPDATE 
        cricket_team
    SET
        player_name = '${playerName}', 
        jersey_number = '${jerseyNumber}',
        role = '${role}'
    WHERE 
        player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// Delete Player API
app.delete("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const deleteQuery = `DELETE FROM
        cricket_team
    WHERE 
        player_id = ${playerId};`;

  await db.run(deleteQuery);
  response.send("Player Removed");
});

module.exports = app;
