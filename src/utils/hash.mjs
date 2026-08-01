import { createHash } from "node:crypto";

export const generateUrlHash = (urlString) => {
  const hash = createHash("sha256").update(urlString).digest("base64");
  return hash.replaceAll(/[^a-zA-Z0-9]/g, "");
};
