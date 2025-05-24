require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { createHash } = require("node:crypto");
const path = require("path");
const cron = require("node-cron");

const { createMongoClient } = require("./utils/mongo");
const { log, error } = require("./utils/helpers");

const app = express();
const port = process.env.APP_PORT;
const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";

app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "app")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use((req, res, next) => {
  log(`[request] ${req.originalUrl}`);
  next();
});

app.get("/health", async (req, res) => {
  // Check DB
  let dbHealth = false;
  try {
    const db = await createMongoClient();
    const stats = await db.stats();
    if (stats?.ok === 1) dbHealth = true;
  } catch (e) {
    error("db check failed: ", e);
  }

  res.status(200).send({ serverHealth: true, dbHealth });
});

app.post("/shorten", async (req, res) => {
  log("[/shorten] request: ", { body: req.body });
  const db = await createMongoClient();
  const linkCollection = db.collection("links");

  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  if (!req.body.url || req.body.url?.match(urlRegex)?.length < 0) {
    error("[/shorten] invalid url");
    return res.status(400).send({ message: "Invalid URL." });
  }

  const hash = createHash("sha256").update(req.body.url).digest("base64");
  const code = hash.slice(0, 6);
  log("[/shorten] created code: ", { code });

  const dupeCheck = await linkCollection.findOne({ code });
  const time = new Date().getTime();
  log("[/shorten] dupe check: ", { duped: !!dupeCheck?.id });

  if (dupeCheck?._id) {
    log("[/shorten] sending cached link");
    return res.status(200).send({
      endpoint: req.body.url,
      redirect: appOrigin + "/" + code,
      time,
    });
  } else {
    const link = {
      endpoint: req.body.url,
      code,
      time,
    };

    log("[/shorten] creating link: ", { link });
    await linkCollection.insertOne(link).catch((e) => {
      return res.status(500).send({
        message: "Error creating link.",
      });
    });

    log("[/shorten] sending created link");
    res.status(200).send({
      endpoint: req.body.url,
      redirect: appOrigin + "/" + code,
      time: new Date().getTime(),
    });
  }
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;
  log("[/:code] requested link: ", { code });

  const validCode = code && code.match(/[a-zA-Z0-9]{6}/)?.length >= 1;
  if (!validCode) {
    error("[/:code] invalid code");
    return res.sendFile(__dirname + "/400.html");
  }

  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const data = await linkCollection.findOne({ code });
  log("[/:code] link lookup: ", { data });

  if (!data || !data.endpoint) {
    error("[/:code] link not found");
    return res.sendFile(__dirname + "/404.html");
  }

  log("[/:code] sending redirect to endpoint");
  res.redirect(data.endpoint);
});

const crontime = process.env.CLEANUP_CRON || "1 * * * *";
log("[cron] cron startup: ", crontime);
cron.schedule(crontime, async () => {
  log("[cron] running cleardown.");
  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const deleteResp = await linkCollection.deleteMany({});
  log("[cron] cleardown resp: ", deleteResp);
});

// Start the server
app.listen(port, () => {
  log(`[init] running on ${appOrigin}`);
});
