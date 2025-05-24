const { MongoClient } = require("mongodb");

/**
 * Creates a new mongodb client using our env vars.
 */
const createMongoClient = async () => {
  // Init client.
  const client = new MongoClient(process.env.MONGO_URI);

  // Do connection.
  await client.connect();

  // Return default DB (found in uri).
  return client.db();
};

module.exports = { createMongoClient };
