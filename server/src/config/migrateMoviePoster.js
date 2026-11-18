import { DataTypes } from "sequelize";

// sync() does not widen an existing MySQL VARCHAR column automatically.
export const migrateMoviePoster = async (sequelize) => {
  if (sequelize.getDialect() !== "mysql") return;
  const query = sequelize.getQueryInterface();
  const columns = await query.describeTable("movies");
  if (columns.poster.type.toUpperCase() !== "MEDIUMTEXT") {
    await query.changeColumn("movies", "poster", {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    });
  }
};
