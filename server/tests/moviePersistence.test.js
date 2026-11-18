import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

// This integration test uses a private in-memory database, never the configured MySQL.
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = ":memory:";
const { default: app } = await import("../src/app.js");
const { sequelize } = await import("../src/config/database.js");
const { Movie } = await import("../src/models/index.js");
const { migrateMoviePoster } = await import("../src/config/migrateMoviePoster.js");

test("movie API persists a large poster, updates and deletes the database row", async () => {
  await sequelize.sync();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/movies`;
  const token = jwt.sign({ id: "test-admin", role: "admin" }, process.env.JWT_SECRET || "default_jwt_secret");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const movie = { id: "upload-test", title: "Test", genre: "Action", duration: 120,
    poster: "data:image/jpeg;base64," + "A".repeat(200000) };
  try {
    const slugMovie = { title: "Đường Về: Phần Hai", genre: "Action", duration: 120 };
    const slugCreated = await fetch(base, { method: "POST", headers, body: JSON.stringify(slugMovie) });
    assert.equal(slugCreated.status, 201);
    assert.equal((await slugCreated.json()).id, "duong");
    for (const [title, expected] of [["Avenger", "avenger"], ["  Avengers: Endgame", "avengers"]]) {
      const response = await fetch(base, { method: "POST", headers,
        body: JSON.stringify({ title, genre: "Action", duration: 120 }) });
      assert.equal(response.status, 201);
      assert.equal((await response.json()).id, expected);
    }
    const duplicate = await fetch(base, { method: "POST", headers, body: JSON.stringify(slugMovie) });
    assert.equal(duplicate.status, 409);
    const denied = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(movie) });
    assert.equal(denied.status, 401);
    const created = await fetch(base, { method: "POST", headers, body: JSON.stringify(movie) });
    assert.equal(created.status, 201, await created.text());
    assert.equal((await Movie.findByPk(movie.id)).poster, movie.poster);
    const updated = await fetch(`${base}/${movie.id}`, { method: "PUT", headers, body: JSON.stringify({ title: "Edited" }) });
    assert.equal(updated.status, 200);
    const retrieved = await fetch(`${base}/${movie.id}`);
    assert.equal((await retrieved.json()).title, "Edited");
    const removed = await fetch(`${base}/${movie.id}`, { method: "DELETE", headers });
    assert.equal(removed.status, 200);
    assert.equal(await Movie.findByPk(movie.id), null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
});

test("existing MySQL poster column is widened once without recreating the table", async () => {
  let type = "VARCHAR(255)";
  let changes = 0;
  const db = { getDialect: () => "mysql", getQueryInterface: () => ({
    describeTable: async () => ({ poster: { type } }),
    changeColumn: async (table, column, options) => {
      assert.equal(table, "movies");
      assert.equal(column, "poster");
      assert.equal(options.type.toSql(), "MEDIUMTEXT");
      type = "MEDIUMTEXT";
      changes += 1;
    },
  }) };
  await migrateMoviePoster(db);
  await migrateMoviePoster(db);
  assert.equal(changes, 1);
});
