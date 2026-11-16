import { User } from "./User.js";
import { Movie } from "./Movie.js";
import { Room } from "./Room.js";
import { Show } from "./Show.js";
import { Ticket } from "./Ticket.js";
import { TicketSeat } from "./TicketSeat.js";
import { Coupon } from "./Coupon.js";

User.hasMany(Ticket, { foreignKey: "userId", as: "tickets" });
Ticket.belongsTo(User, { foreignKey: "userId", as: "user" });

Movie.hasMany(Show, { foreignKey: "movieId", as: "shows" });
Show.belongsTo(Movie, { foreignKey: "movieId", as: "movie" });

Room.hasMany(Show, { foreignKey: "roomId", as: "shows" });
Show.belongsTo(Room, { foreignKey: "roomId", as: "room" });

Show.hasMany(Ticket, { foreignKey: "showId", as: "tickets" });
Ticket.belongsTo(Show, { foreignKey: "showId", as: "show" });

Ticket.hasMany(TicketSeat, { foreignKey: "ticketId", as: "seats" });
TicketSeat.belongsTo(Ticket, { foreignKey: "ticketId", as: "ticket" });

Show.hasMany(TicketSeat, { foreignKey: "showId", as: "ticketSeats" });
TicketSeat.belongsTo(Show, { foreignKey: "showId", as: "show" });

export { User, Movie, Room, Show, Ticket, TicketSeat, Coupon };
