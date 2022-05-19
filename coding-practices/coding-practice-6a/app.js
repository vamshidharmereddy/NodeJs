const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStatesArrayToObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictArrayToObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertStateStatsToObject = (dbObject) => {
  return {
    totalCases: dbObject.totalCases,
    totalCured: dbObject.totalCured,
    totalActive: dbObject.totalActive,
    totalDeaths: dbObject.totalDeaths,
  };
};

// API 1
app.get("/states/", async (request, response) => {
  const statesQuery = `SELECT * FROM state;`;
  const statesArray = await database.all(statesQuery);
  response.send(
    statesArray.map((eachState) => convertStatesArrayToObject(eachState))
  );
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateArray = await database.get(stateQuery);
  response.send(convertStatesArrayToObject(stateArray));
});

// API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES
        ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');
    `;

  const dbResponse = await database.run(addDistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtQuery = `
    SELECT * FROM 
        district
    WHERE 
        district_id = ${districtId};
    `;
  const districtResult = await database.get(districtQuery);
  response.send(convertDistrictArrayToObject(districtResult));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
    DELETE FROM 
        district
    WHERE 
        district_id = ${districtId};
    `;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictQuery = `
    UPDATE 
        district
    SET
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'
    WHERE 
        district_id = ${districtId};
    `;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatsQuery = `
    SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
    FROM
        district
    WHERE
        state_id = ${stateId};
    `;

  const stateData = await database.all(getStatsQuery);
  response.send(stateData);
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const stateIdQuery = `
    SELECT 
        *
    FROM
        state
    WHERE 
        state_id = (SELECT 
        state_id 
    FROM 
        district
    WHERE 
        district_id = ${districtId});
    `;
  const stateDetails = await database.get(stateIdQuery);
  response.send({ stateName: stateDetails.state_name });
});

module.exports = app;
