const { MongoClient, ServerApiVersion } = require("mongodb");

/**
 * Creates a new mongodb client using our env vars.
 */
const createMongoClient = async () => {
  console.log("creating mongodb client: ", process.env.MONGO_URI);
  // Init client.
  const client = new MongoClient(process.env.MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  // Do connection.
  await client.connect();

  // Return default DB (found in uri).
  return client.db();
};

module.exports = { createMongoClient };
