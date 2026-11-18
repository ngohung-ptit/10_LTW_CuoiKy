import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

// Database riêng cho kiểm thử; không chạm vào MySQL hay dữ liệu đang dùng.
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = ":memory:";
const { default: app } = await import("../src/app.js");
const { sequelize } = await import("../src/config/database.js");
const { Room, Show, Movie, User, Ticket } = await import("../src/models/index.js");

test("room/show CRUD persists database rows and rejects unsafe mutations", async () => {
  await sequelize.sync();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = (role) => jwt.sign({ id: "test-user", role }, process.env.JWT_SECRET || "default_jwt_secret");
  const request = async (method, endpoint, body, role = "admin") => {
    const response = await fetch(base + endpoint, {
      method, headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${token(role)}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: await response.json() };
  };
  const roomData = { name: "Phòng thử", rows: 6, columns: 8, vipRows: ["D"] };
  try {
    assert.equal((await request("POST", "/rooms", roomData, null)).status, 401);
    assert.equal((await request("POST", "/rooms", roomData, "member")).status, 403);
    assert.equal((await request("POST", "/rooms", { ...roomData, rows: 0 })).status, 400);
    const created = await request("POST", "/rooms", roomData);
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.deepEqual((await Room.findByPk(id)).vipRows, ["D"]);
    assert.equal((await request("POST", "/rooms", roomData)).status, 409);
    assert.equal((await request("PUT", `/rooms/${id}`, { name: "Phòng đã sửa", columns: 10 })).status, 200);
    assert.equal((await Room.findByPk(id)).columns, 10);
    assert.equal((await request("GET", `/rooms/${id}`)).data.name, "Phòng đã sửa");
    await Movie.create({ id: "test-movie", title: "Test", genre: "Action", duration: 120, year: 2026, poster: "test.jpg" });
    const body = { movieId: "test-movie", roomId: id, date: "2099-01-01", time: "10:00", price: 75000, vipPrice: 95000 };
    const createdShow = await request("POST", "/shows", body);
    assert.equal(createdShow.status, 201);
    const showId = createdShow.data.id;
    assert.equal((await Show.findByPk(showId)).time, "10:00");
    assert.equal((await request("PUT", `/shows/${showId}`, { ...body, time: "11:00" })).status, 200);
    assert.equal((await Show.findByPk(showId)).time, "11:00");
    const second = await request("POST", "/shows", { ...body, time: "15:00" });
    assert.equal(second.status, 201);
    assert.equal((await request("PUT", `/shows/${showId}`, { ...body, time: "14:00" })).status, 400);
    assert.equal((await Show.findByPk(showId)).time, "11:00");
    assert.equal((await request("PUT", `/shows/${showId}`, { ...body, price: -1 })).status, 400);
    assert.equal((await request("PUT", `/rooms/${id}`, { rows: 5 })).status, 400);
    assert.equal((await request("DELETE", `/rooms/${id}`)).status, 400);
    assert.ok(await Room.findByPk(id));
    assert.equal((await request("DELETE", `/shows/${second.data.id}`)).status, 200);
    assert.equal(await Show.findByPk(second.data.id), null);
    await User.create({ id: "test-user", name: "Test", email: "test@udu.example", password: "test-hash", role: "member" });
    await Ticket.create({ id: "test-ticket", userId: "test-user", showId, movieId: "test-movie", total: 75000, status: "cancelled" });
    assert.equal((await request("PUT", `/shows/${showId}`, body)).status, 400);
    assert.equal((await request("DELETE", `/shows/${showId}`)).status, 400);
    assert.ok(await Ticket.findByPk("test-ticket"));
    await Ticket.destroy({ where: { id: "test-ticket" } });
    assert.equal((await request("DELETE", `/shows/${showId}`)).status, 200);
    assert.equal(await Show.findByPk(showId), null);
    assert.deepEqual((await request("GET", "/shows")).data, []);
    assert.equal((await request("DELETE", `/rooms/${id}`)).status, 200);
    assert.equal(await Room.findByPk(id), null);
    assert.deepEqual((await request("GET", "/rooms")).data, []);
    assert.equal((await request("PUT", "/shows/missing", body)).status, 404);
    assert.equal((await request("DELETE", "/rooms/missing")).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  }
});
