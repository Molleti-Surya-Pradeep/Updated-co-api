const express = require("express");
const app = express();
const path = require("path");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

app.use(express.json());

const dbpath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const intilizeserverandDB = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started Sucessfully");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

intilizeserverandDB();

// Api 1

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(username, password);
  if (username === "christopher_phillips") {
    if (password === "christy@123") {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "abcd");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

const AuthenticationwithToken = (request, response, next) => {
  let jwttoken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwttoken = authHeader.split(" ")[1];
  }
  if (jwttoken !== undefined) {
    jwt.verify(jwttoken, "abcd", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.jwtToken = jwttoken;
        next();
      }
    });
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }
};

const conversioncolumns = (dbobject) => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    cured: dbobject.cured,
    active: dbobject.active,
    cases: dbobject.cases,
    deaths: dbobject.deaths,
  };
};

// Api 2

app.get("/states", AuthenticationwithToken, async (request, response) => {
  const { jwtToken } = request;
  console.log(jwtToken);
  const query1 = `SELECT * from state;`;
  let dbarray = await db.all(query1);
  dbarray = dbarray.map((item) => conversioncolumns(item));
  response.send(dbarray);
});

// Api 3

app.get(
  "/states/:stateId",
  AuthenticationwithToken,
  async (request, response) => {
    const { stateId } = request.params;

    const query1 = `SELECT * from state WHERE state_id=${stateId};`;
    const dbarray = await db.get(query1);

    response.send(conversioncolumns(dbarray));
  }
);

// Api 4
app.post("/districts", AuthenticationwithToken, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const query1 = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
        VALUES('${districtName}' , '${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const dbarray = await db.run(query1);
  response.send("District Successfully Added");
});

// Api 5

app.get(
  "/districts/:districtId",
  AuthenticationwithToken,
  async (request, response) => {
    const { districtId } = request.params;

    const query1 = `SELECT * from district WHERE district_id=${districtId};`;
    const dbarray = await db.get(query1);

    response.send(conversioncolumns(dbarray));
  }
);

// Api 6

app.delete(
  "/districts/:districtId",
  AuthenticationwithToken,
  async (request, response) => {
    const { districtId } = request.params;
    const query1 = `DELETE FROM district WHERE district_id = ${districtId};`;
    await db.run(query1);
    response.send("District Removed");
  }
);

// Api 7
app.put(
  "/districts/:districtId",
  AuthenticationwithToken,
  async (request, response) => {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const { districtId } = request.params;
    const query1 = `UPDATE district SET 
    district_name='${districtName}' , state_id = '${stateId}',cases = '${cases}',cured = '${cured}',active = '${active}',deaths = '${deaths}';`;
    const dbarray = await db.run(query1);
    response.send("District Details Updated");
  }
);

// Api 8

app.get(
  "/states/:stateId/stats",
  AuthenticationwithToken,
  async (request, response) => {
    const { stateId } = request.params;

    const query1 = `SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths from district WHERE state_id=${stateId};`;
    const dbarray = await db.get(query1);

    response.send(dbarray);
  }
);

module.exports = app;
