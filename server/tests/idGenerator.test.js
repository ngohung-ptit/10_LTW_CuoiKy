import test from "node:test";
import assert from "node:assert/strict";

process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = ":memory:";

const {
  slugify,
  buildRoomBaseId,
  buildShowBaseId,
  buildUserBaseId,
  generateUniqueId,
} = await import("../src/utils/idGenerator.js");
const { sequelize } = await import("../src/config/database.js");
const { Room, Show, User, Movie } = await import("../src/models/index.js");

test("idGenerator utilities produce memorable IDs matching seed conventions", async () => {
  assert.equal(buildRoomBaseId("Phòng 01"), "room-1");
  assert.equal(buildRoomBaseId("Phòng 02"), "room-2");
  assert.equal(buildRoomBaseId("Phòng 10"), "room-10");
  assert.equal(buildRoomBaseId("Phòng thử"), "room-thu");
  assert.equal(buildRoomBaseId("Phòng VIP"), "room-vip");

  assert.equal(
    buildShowBaseId({ date: "2026-11-18", movieId: "interstellar", roomId: "room-1" }),
    "2026-11-18-interstellar-1"
  );
  assert.equal(
    buildShowBaseId({ date: "2026-11-18", movieId: "interstellar", roomId: "room-2" }),
    "2026-11-18-interstellar-2"
  );
  assert.equal(
    buildShowBaseId({ date: "2026-11-18", movieId: "dune", roomId: "room-thu" }),
    "2026-11-18-dune-thu"
  );

  assert.equal(buildUserBaseId({ email: "admin@udu.example", role: "admin" }), "udu-admin");
  assert.equal(buildUserBaseId({ email: "member@udu.example", role: "member" }), "udu-member");
  assert.equal(buildUserBaseId({ email: "student@udu.example", role: "member" }), "udu-student");
  assert.equal(buildUserBaseId({ email: "john.doe@company.com" }), "udu-john-doe");

  const existing = new Set(["item", "item-2"]);
  const nextId = await generateUniqueId("item", (id) => Promise.resolve(existing.has(id)));
  assert.equal(nextId, "item-3");
});

test("models automatically generate memorable IDs on creation when id is omitted", async () => {
  await sequelize.sync({ force: true });

  const room1 = await Room.create({ name: "Phòng 01", rows: 6, columns: 8 });
  assert.equal(room1.id, "room-1");

  const room2 = await Room.create({ name: "Phòng 02", rows: 6, columns: 8 });
  assert.equal(room2.id, "room-2");

  const roomVip = await Room.create({ name: "Phòng VIP", rows: 6, columns: 8 });
  assert.equal(roomVip.id, "room-vip");

  const movie = await Movie.create({ title: "Interstellar", genre: "Sci-Fi", duration: 169, year: 2014, poster: "poster.jpg" });
  assert.equal(movie.id, "interstellar");

  const show1 = await Show.create({
    movieId: movie.id,
    roomId: room1.id,
    date: "2026-11-18",
    time: "10:00",
  });
  assert.equal(show1.id, "2026-11-18-interstellar-1");

  const show2 = await Show.create({
    movieId: movie.id,
    roomId: room1.id,
    date: "2026-11-18",
    time: "14:00",
  });
  assert.equal(show2.id, "2026-11-18-interstellar-1-2");

  const showInRoom2 = await Show.create({
    movieId: movie.id,
    roomId: room2.id,
    date: "2026-11-18",
    time: "10:00",
  });
  assert.equal(showInRoom2.id, "2026-11-18-interstellar-2");

  const admin = await User.create({ name: "Admin", email: "admin@udu.example", password: "pwd", role: "admin" });
  assert.equal(admin.id, "udu-admin");

  const member = await User.create({ name: "Member", email: "member@udu.example", password: "pwd" });
  assert.equal(member.id, "udu-member");

  const student = await User.create({ name: "Student", email: "student@udu.example", password: "pwd" });
  assert.equal(student.id, "udu-student");

  const studentAgain = await User.create({ name: "Another Student", email: "student@other.example", password: "pwd" });
  assert.equal(studentAgain.id, "udu-student-2");
});
