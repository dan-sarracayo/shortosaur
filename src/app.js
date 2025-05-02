require("dotenv").config({
  path: [".env.production", ".env"],
  override: true,
  debug: true,
});

console.log("startup: ", {
  mongo_uri: process.env.MONGO_URI,
  app_port: process.env.APP_PORT,
});

const express = require("express");
const bodyParser = require("body-parser");
const { createHash } = require("node:crypto");

const { createMongoClient } = require("./utils/mongo");

const app = express();
const port = process.env.APP_PORT;
app.use(bodyParser.json());

// A simple route
app.get("/", (req, res) => {
  res.send({ status: 200 });
});

app.post("/shorten", async (req, res) => {
  const db = await createMongoClient();
  const linkCollection = db.collection("links");

  const hash = createHash("sha256").update(req.body.url).digest("base64");
  const code = hash.slice(0, 6);

  const link = {
    endpoint: req.body.url,
    code,
  };
  linkCollection.insertOne(link);

  res.send({ status: 200, shortening: code });
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;

  const validCode = code && code.match(/[a-zA-Z0-9]{6}/).length >= 1;
  if (!validCode) {
    return req.send(400, "invalid code");
  }

  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const data = await linkCollection.findOne({ code });
  const { endpoint } = data;
  if (!data || !endpoint) {
    return req.send(404, "unknown code");
  }

  res.redirect(304, endpoint);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
