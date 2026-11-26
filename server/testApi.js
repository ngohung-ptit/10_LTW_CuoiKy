import http from "http";
import assert from "node:assert/strict";
import app from "./src/app.js";
import { connectDB, disconnectDB, DEFAULT_MONGODB_URI } from "./src/config/database.js";
import { seedDatabase } from "./src/seed/seedData.js";

const openDatabase = async () => {
  if (process.env.TEST_USE_LIVE_DB === "true") {
    const configuredUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    await connectDB(configuredUri, { serverSelectionTimeoutMS: 5000 });
    return { mode: "configured", stop: () => disconnectDB() };
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  await seedDatabase({ closeConnection: false });
  return {
    mode: "in-memory",
    stop: async () => {
      await disconnectDB();
      await mongod.stop();
    },
  };
};

const runTests = async () => {
  const db = await openDatabase();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`Test server running at ${baseUrl} (MongoDB mode: ${db.mode})`);

  let adminToken = "";
  let memberToken = "";

  try {
    {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "member@udu.example",
          password: "Member@12345",
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      memberToken = data.token;
      console.log("1. Member Login: PASS", res.status);
    }

    {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@udu.example",
          password: "Admin@12345",
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      adminToken = data.token;
      console.log("2. Admin Login: PASS", res.status);
    }

    {
      const res = await fetch(`${baseUrl}/movies`);
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.ok(data.length > 0);
      console.log("3. Get Movies: PASS", `Found ${data.length} movies`);

      const pageRes = await fetch(`${baseUrl}/movies?page=1&limit=2`);
      const pageData = await pageRes.json();
      assert.equal(pageRes.status, 200);
      assert.equal(pageData.items.length, 2);
      assert.ok(pageData.pagination.total >= 2);
      console.log("3b. Movies Pagination & Filter: PASS", `Total: ${pageData.pagination.total}`);
    }

    let futureShow = null;
    {
      const res = await fetch(`${baseUrl}/shows`);
      const data = await res.json();
      assert.equal(res.status, 200);
      futureShow = data.find((s) => {
        const dt = new Date(`${s.date}T${s.time}:00+07:00`);
        return dt.getTime() > Date.now() + 3 * 60 * 60 * 1000;
      });
      assert.ok(futureShow, "Expected at least one future show > 3h from now");
      console.log("4. Get Future Show: PASS", futureShow.id, futureShow.date, futureShow.time);
    }

    let bookedTicketId = "";
    {
      const couponRes = await fetch(`${baseUrl}/coupons/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "UDU10" }),
      });
      assert.equal(couponRes.status, 200);

      const res = await fetch(`${baseUrl}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          showId: futureShow.id,
          seats: ["B1", "B2"],
          couponCode: "UDU10",
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      bookedTicketId = data.ticket?.id;
      assert.ok(bookedTicketId);
      assert.ok(data.ticket?.qrCode);
      assert.equal(data.ticket?.couponCode, "UDU10");
      console.log("5. Book Seats + Coupon + QR (201): PASS", `Ticket: ${bookedTicketId}`);
    }

    {
      const res = await fetch(`${baseUrl}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          showId: futureShow.id,
          seats: ["B1", "C3"],
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 409);
      assert.deepEqual(data.conflicts, ["B1"]);
      console.log("6. Seat Conflict (409): PASS", `Conflicts: ${JSON.stringify(data.conflicts)}`);
    }

    {
      const res = await fetch(`${baseUrl}/shows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          movieId: futureShow.movieId,
          roomId: futureShow.roomId,
          date: futureShow.date,
          time: futureShow.time,
          price: 75000,
          vipPrice: 95000,
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.match(data.error, /chồng giờ/i);
      console.log("7. Show Overlap Check (400): PASS", `Error: ${data.error}`);
    }

    {
      const res = await fetch(`${baseUrl}/tickets/${bookedTicketId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      console.log("8. Cancel Ticket (200): PASS", data.message);

      const showRes = await fetch(`${baseUrl}/shows/${futureShow.id}`);
      const showData = await showRes.json();
      assert.equal(showData.sold.includes("B1"), false);
      console.log("8b. Seat Released Verification: PASS");
    }

    {
      const res = await fetch(`${baseUrl}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      console.log("9. Admin Analytics Dashboard: PASS", `Revenue: ${data.totalRevenue}, Confirmed: ${data.confirmedCount}`);
    }

    {
      const [movieRes, dateRes] = await Promise.all([
        fetch(`${baseUrl}/analytics/by-movie`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${baseUrl}/analytics/by-date`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      ]);
      const movieData = await movieRes.json();
      const dateData = await dateRes.json();
      assert.equal(movieRes.status, 200);
      assert.equal(dateRes.status, 200);
      assert.ok(Array.isArray(movieData) && movieData.length > 0);
      assert.ok(Array.isArray(dateData));
      console.log("10. Admin Analytics By Movie & Date: PASS", `Movies: ${movieData.length}, Dates: ${dateData.length}`);
    }

    console.log("\nALL BACKEND MONGODB TESTS PASSED SUCCESSFULLY!");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await db.stop();
  }
};

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  });
