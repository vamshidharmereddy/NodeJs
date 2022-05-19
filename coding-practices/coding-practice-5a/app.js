const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
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
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertMovieArrayToObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorArrayToObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};
// All Movies API
app.get("/movies/", async (request, response) => {
  const getAllMoviesQuery = `SELECT * FROM movie;`;
  const movieArray = await db.all(getAllMoviesQuery);
  response.send(
    movieArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

// Add New Movie API
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;

  const addMovieQuery = `
  INSERT INTO
    movie (director_id, movie_name, lead_actor)
  VALUES
    ('${directorId}', '${movieName}', '${leadActor}');`;

  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

// GET Movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const movieQuery = `
      SELECT
          *
      FROM
          movie
      WHERE
          movie_id = ${movieId};
      `;
  const movieResult = await db.get(movieQuery);
  response.send(convertMovieArrayToObject(movieResult));
});

// Update Movie API
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
    UPDATE
        movie
    SET
        director_id = '${directorId}',
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE
        movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

// Delete Movie API
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieQuery = `
    DELETE FROM 
        movie 
    WHERE 
        movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// All Directors API
app.get("/directors/", async (request, response) => {
  const directorsQuery = `SELECT * FROM director;`;
  const directorArray = await db.all(directorsQuery);
  response.send(
    directorArray.map((eachDirector) =>
      convertDirectorArrayToObject(eachDirector)
    )
  );
});

// GET Movies By Director API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const moviesByDirectorsQuery = `SELECT * FROM movie WHERE director_id = ${directorId};`;
  const directorMoviesArray = await db.all(moviesByDirectorsQuery);
  response.send(
    directorMoviesArray.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
