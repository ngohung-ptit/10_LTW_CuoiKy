import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dialect = process.env.DB_DIALECT || "sqlite";

export const sequelize =
  dialect === "mysql"
    ? new Sequelize(
        process.env.DB_NAME || "cinenep",
        process.env.DB_USER || "root",
        process.env.DB_PASSWORD || "",
        {
          host: process.env.DB_HOST || "localhost",
          port: Number(process.env.DB_PORT) || 3306,
          dialect: "mysql",
          logging: false,
        }
      )
    : new Sequelize({
        dialect: "sqlite",
        storage: process.env.DB_STORAGE || path.resolve(__dirname, "../../database.sqlite"),
        logging: false,
      });
