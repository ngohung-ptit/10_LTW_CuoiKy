import { Op, fn, col } from "sequelize";
import { Ticket, TicketSeat, Show, Movie } from "../models/index.js";

const parseShowDateTime = (date, time) => {
  return new Date(`${date}T${time}:00+07:00`);
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const { date } = req.query;

    const showWhere = {};
    if (date) {
      showWhere.date = date;
    }

    const tickets = await Ticket.findAll({
      where: { status: "confirmed" },
      include: [
        {
          model: Show,
          as: "show",
          where: showWhere,
        },
        {
          model: TicketSeat,
          as: "seats",
        },
      ],
    });

    const totalRevenue = tickets.reduce((sum, t) => sum + t.total, 0);
    const confirmedCount = tickets.length;
    const totalSeats = tickets.reduce((sum, t) => sum + (t.seats?.length || 0), 0);

    const allShows = await Show.findAll({
      where: showWhere,
    });
    const upcomingShowsCount = allShows.filter(
      (s) => parseShowDateTime(s.date, s.time) > new Date()
    ).length;

    res.status(200).json({
      totalRevenue,
      confirmedCount,
      totalSeats,
      upcomingShowsCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueByMovie = async (req, res, next) => {
  try {
    const { date } = req.query;

    const showWhere = {};
    if (date) {
      showWhere.date = date;
    }

    const movies = await Movie.findAll();

    const tickets = await Ticket.findAll({
      where: { status: "confirmed" },
      include: [
        {
          model: Show,
          as: "show",
          where: showWhere,
        },
        {
          model: TicketSeat,
          as: "seats",
        },
      ],
    });

    const result = movies.map((movie) => {
      const movieTickets = tickets.filter((t) => t.movieId === movie.id);
      const total = movieTickets.reduce((sum, t) => sum + t.total, 0);
      const seats = movieTickets.reduce((sum, t) => sum + (t.seats?.length || 0), 0);

      return {
        movieId: movie.id,
        title: movie.title,
        total,
        seats,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRevenueByDate = async (req, res, next) => {
  try {
    const tickets = await Ticket.findAll({
      where: { status: "confirmed" },
      include: [
        {
          model: Show,
          as: "show",
          attributes: ["date"],
        },
      ],
    });

    const dailyMap = {};
    for (const t of tickets) {
      const showDate = t.show?.date;
      if (showDate) {
        dailyMap[showDate] = (dailyMap[showDate] || 0) + t.total;
      }
    }

    const result = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      total,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

