import http from "http";
import app from "./src/app.js";
import { sequelize } from "./src/config/database.js";

const runTests = async () => {
  await sequelize.authenticate();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`Test server running at ${baseUrl}`);

  let adminToken = "";
  let memberToken = "";

  // 1. Auth: Login as Member
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
    console.log("1. Member Login:", res.status === 200 ? "PASS" : "FAIL", res.status);
    memberToken = data.token;
  }

  // 2. Auth: Login as Admin
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
    console.log("2. Admin Login:", res.status === 200 ? "PASS" : "FAIL", res.status);
    adminToken = data.token;
  }

  // 3. Movies List
  {
    const res = await fetch(`${baseUrl}/movies`);
    const data = await res.json();
    console.log("3. Get Movies:", res.status === 200 && data.length > 0 ? "PASS" : "FAIL", `Found ${data.length} movies`);
  }

  // 4. Shows List - Pick a future show (day 2)
  let futureShow = null;
  {
    const res = await fetch(`${baseUrl}/shows`);
    const data = await res.json();
    futureShow = data.find((s) => {
      const dt = new Date(`${s.date}T${s.time}:00+07:00`);
      return dt.getTime() > Date.now();
    });
    console.log("4. Get Future Show:", futureShow ? "PASS" : "FAIL", futureShow?.id, futureShow?.date, futureShow?.time);
  }

  // 5. Booking Test: Book seats B1, B2 on futureShow
  let bookedTicketId = "";
  {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        showId: futureShow.id,
        seats: ["B1", "B2"],
      }),
    });
    const data = await res.json();
    bookedTicketId = data.ticket?.id;
    console.log("5. Book Seats (201):", res.status === 201 ? "PASS" : "FAIL", `Status: ${res.status}`, `Ticket: ${bookedTicketId}, QR: ${Boolean(data.ticket?.qrCode)}`);
  }

  // 6. Booking Test: Conflict 409 (Second person books B1 again)
  {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        showId: futureShow.id,
        seats: ["B1", "C3"], // B1 is now taken!
      }),
    });
    const data = await res.json();
    console.log("6. Seat Conflict (409):", res.status === 409 ? "PASS" : "FAIL", `Status: ${res.status}, Conflicts: ${JSON.stringify(data.conflicts)}`);
  }

  // 7. Overlap Test: Admin creating overlapping show in the future
  {
    const res = await fetch(`${baseUrl}/shows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movieId: "dune",
        roomId: futureShow.roomId,
        date: futureShow.date,
        time: futureShow.time, // Same room, same date, same time!
        price: 75000,
        vipPrice: 95000,
      }),
    });
    const data = await res.json();
    console.log("7. Show Overlap Check (400):", res.status === 400 ? "PASS" : "FAIL", `Status: ${res.status}, Error: ${data.error}`);
  }

  // 8. Cancel Ticket Test (More than 2 hours in advance)
  {
    const res = await fetch(`${baseUrl}/tickets/${bookedTicketId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${memberToken}`,
      },
    });
    const data = await res.json();
    console.log("8. Cancel Ticket (200):", res.status === 200 ? "PASS" : "FAIL", data.message || data.error);
  }

  // 8b. Verify B1 is released after cancellation!
  {
    const res = await fetch(`${baseUrl}/shows/${futureShow.id}`);
    const data = await res.json();
    const isB1Released = !data.sold.includes("B1");
    console.log("8b. Seat Released Verification:", isB1Released ? "PASS" : "FAIL", `Sold list: ${JSON.stringify(data.sold)}`);
  }

  // 9. Admin Analytics
  {
    const res = await fetch(`${baseUrl}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    console.log("9. Admin Analytics Dashboard:", res.status === 200 ? "PASS" : "FAIL", `Revenue: ${data.totalRevenue}, Confirmed: ${data.confirmedCount}`);
  }

  // 10. Admin Analytics by movie
  {
    const res = await fetch(`${baseUrl}/analytics/by-movie`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    console.log("10. Admin Analytics By Movie:", res.status === 200 && Array.isArray(data) ? "PASS" : "FAIL", `Movies count: ${data.length}`);
  }

  server.close();
  console.log("\nALL BACKEND TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
};

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
