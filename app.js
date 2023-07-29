const express = require("express");
const path = require("path");

// database resource
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
// express server
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const convertDistrictObjectToResponseObject = (dbObject) => ({
  districtId: dbObject.district_id,
  districtName: dbObject.district_name,
  stateId: dbObject.state_id,
  cases: dbObject.cases,
  cured: dbObject.cured,
  active: dbObject.active,
  deaths: dbObject.deaths,
});

const convertStateObjectToResponseObject = (dbObject) => ({
  stateId: dbObject.state_id,
  stateName: dbObject.state_name,
  population: dbObject.population,
});

async function dbConnection() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("3000"));
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
}
dbConnection();

// API-1
app.get("/states/", async (request, response) => {
  const getStates = `
        SELECT 
            *
        FROM
            state;`;
  const dbResponse = await db.all(getStates);
  response.send(
    dbResponse.map((eachState) => convertStateObjectToResponseObject(eachState))
  );
});

// API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
        SELECT
            *
        FROM 
            state
        WHERE state_id =${stateId};`;
  const dbResponse = await db.get(getState);
  response.send(convertStateObjectToResponseObject(dbResponse));
});

// API-3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `
      INSERT
      INTO
          district(district_name,state_id,cases,cured,active,deaths)
      VALUES
          ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(addDistrict);
  response.send("District Successfully Added");
});

// API-4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id =${districtId};`;
  const dbResponse = await db.get(getDistrict);
  response.send(convertDistrictObjectToResponseObject(dbResponse));
});

// API-5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
        DELETE
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

// API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
  UPDATE 
    district
  SET
    district_name = '${districtName}',
    state_id =${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

// API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalDetails = `
    SELECT 
        SUM(cases) as totalCases,SUM(cured) as totalCured,SUM(active) as totalActive,SUM(deaths) as totalDeaths
    FROM 
        district
    WHERE
        state_id = ${stateId}`;
  const stats = await db.get(getTotalDetails);
  response.send(stats);
});

// APi-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateId = `
        SELECT
            state_id
        FROM
            district
        WHERE
            district_id =${districtId};`;
  const stateId = await db.get(getStateId);
  console.log(stateId.state_id);
  const getStateName = `
        SELECT
            state_name as stateName
        FROM
            state
        WHERE 
            state_id = ${stateId.state_id};`;
  const stateName = await db.get(getStateName);
  response.send(stateName);
});

module.exports = app;
