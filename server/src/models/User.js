import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { buildUserBaseId, generateUniqueId } from "../utils/idGenerator.js";

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("member", "admin"),
      defaultValue: "member",
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

User.beforeValidate(async (user) => {
  if (!user.id && user.email) {
    const baseId = buildUserBaseId(user);
    user.id = await generateUniqueId(baseId, (id) => User.findByPk(id));
  }
});

