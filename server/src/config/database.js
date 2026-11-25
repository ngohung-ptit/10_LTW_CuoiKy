import mongoose from "mongoose";
import "./env.js";

mongoose.set("strictQuery", true);

export const DEFAULT_DB_NAME = "udu_cinematic";
export const DEFAULT_MONGODB_URI = `mongodb://127.0.0.1:27017/${DEFAULT_DB_NAME}`;

export const resolveDbName = (uri, explicitDbName = process.env.DB_NAME) => {
  const configured = typeof explicitDbName === "string" ? explicitDbName.trim() : "";
  if (configured) return configured;

  try {
    const parsed = new URL(uri);
    const pathDb = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    if (pathDb) return pathDb;
  } catch {
    // Non-standard URI formats fall back to DEFAULT_DB_NAME
  }

  return DEFAULT_DB_NAME;
};

export const connectDB = async (
  uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
  options = {}
) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  const dbName = options.dbName || resolveDbName(uri);
  await mongoose.connect(uri, { ...options, dbName });
  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
