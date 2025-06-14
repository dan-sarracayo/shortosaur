require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const { createMongoClient } = require("./utils/mongo");
const { log, error } = require("./utils/helpers");
const { generateUrlHash } = require("./utils/hash");

const app = express();
const port = process.env.APP_PORT;
const appOrigin = process.env.APP_ORIGIN || "http://localhost:3000";

const linkttl = Number(process?.env?.LINK_TTL ?? 60 * 60);

app.use(bodyParser.json());

app.use((req, res, next) => {
  log(`[request] ${req.originalUrl}`);
  next();
});

app.use("/", express.static(path.join(__dirname, "app")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

const validUrlRegex =
  /^(https?:\/\/)?([a-zA-Z0-9\-\.]+)(:[0-9]{1,5})?(\/[^\s]*)?$/;

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

  if (!req.body.url || !req.body.url?.match(validUrlRegex)?.length) {
    error("[/shorten] invalid url");
    return res.status(400).send({ message: "Invalid URL." });
  }

  const hash = generateUrlHash(req.body.url);
  const code = hash.slice(0, 6);
  log("[/shorten] created code: ", { hash, code });

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
      creator: {
        ip: req.ip,
        headers: req.rawHeaders,
      },
      hits: [],
      expiresAfter: new Date().getTime() + linkttl,
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

app.get("/:code([a-zA-Z0-9]{6})", async (req, res) => {
  const code = req.params.code;
  log("[/:code] requested link: ", { code });

  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const data = await linkCollection.findOne({ code });
  log("[/:code] link lookup: ", { data });

  if (!data || !data.endpoint) {
    error("[/:code] link not found");
    return res.sendFile(__dirname + "/404.html");
  }

  const hit = {
    ip: req.ip,
    headers: req.rawHeaders,
  };
  const hits = data?.hits || [];
  await linkCollection.updateOne(
    { _id: data._id },
    { $set: { hits: [...hits, hit] } }
  );

  log("[/:code] sending redirect to endpoint");
  res.redirect(data.endpoint);
});

// Start the server
app.listen(port, () => {
  log(`[init] running on ${appOrigin}`);
});
