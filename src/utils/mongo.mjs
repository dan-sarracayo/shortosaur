import { MongoClient } from "mongodb";
import { log, error } from "./helpers.mjs";

const client = new MongoClient(process.env.MONGO_URI);

try {
  log("[mongodb] connecting...");
  await client.connect();

  log("[mongodb] db connected");
} catch (e) {
  error("[mongodb] failed to connect");
  error(e);
  process.exit(1);
}

export const db = client.db();
