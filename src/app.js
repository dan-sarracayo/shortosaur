require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { createHash } = require("node:crypto");
const path = require("path");
const cron = require("node-cron");

const { createMongoClient } = require("./utils/mongo");

const app = express();
const port = process.env.APP_PORT;
const appOrigin =
  process.env.APP_ORIGIN + ":" + process.env.APP_PORT ||
  "http://localhost:3000";
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "app")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

const log = console.log;

app.get("/health", (req, res) => {
  log("[info][/health] 200 ok");
  res.sendStatus(200);
});

app.post("/shorten", async (req, res) => {
  log("[info][/shorten] request: ", { body: req.body });
  const db = await createMongoClient();
  const linkCollection = db.collection("links");

  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  if (!req.body.url || req.body.url?.match(urlRegex)?.length < 0) {
    log("[error][/shorten] invalid url");
    return res.status(400).send({ message: "Invalid URL." });
  }

  const hash = createHash("sha256").update(req.body.url).digest("base64");
  const code = hash.slice(0, 6);
  log("[info][/shorten] created code: ", { code });

  const dupeCheck = await linkCollection.findOne({ code });
  const time = new Date().getTime();
  log("[info][/shorten] dupe check: ", { duped: !!dupeCheck?.id });

  if (dupeCheck?._id) {
    log("[info][/shorten] sending cached link");
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

    log("[info][/shorten] creating link: ", { link });

    await linkCollection.insertOne(link).catch((e) => {
      return res.status(500).send({
        message: "Error creating link.",
      });
    });

    log("[info][/shorten] sending created link");

    res.status(200).send({
      endpoint: req.body.url,
      redirect: appOrigin + "/" + code,
      time: new Date().getTime(),
    });
  }
});

app.get("/:code", async (req, res) => {
  const code = req.params.code;
  log("[info][/:code] creating link: ", { code });

  const validCode = code && code.match(/[a-zA-Z0-9]{6}/)?.length >= 1;
  if (!validCode) {
    log("[error][/:code] invalid code");
    return res.sendFile(__dirname + "/400.html");
  }

  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const data = await linkCollection.findOne({ code });
  log("[info][/:code] link lookup: ", { data });

  if (!data || !data.endpoint) {
    log("[error][/:code] link not found");
    return res.sendFile(__dirname + "/404.html");
  }

  log("[info][/:code] sending redirect to endpoint");
  res.redirect(data.endpoint);
});

const crontime = process.env.CLEANUP_CRON || "1 * * * *";
log("[info][cron] cron startup: ", crontime);
cron.schedule(crontime, async () => {
  log("[info][cron] running cleardown.");
  const db = await createMongoClient();
  const linkCollection = db.collection("links");
  const deleteResp = await linkCollection.deleteMany({});
  log("[info][cron] cleardown resp: ", deleteResp);
});

// Start the server
app.listen(port, () => {
  log(`[info][init] running on ${appOrigin}`);
});
