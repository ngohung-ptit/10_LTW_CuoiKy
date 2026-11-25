import { Ticket, Show, Movie } from "../models/index.js";
import { parseShowDateTime } from "../utils/queryHelpers.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const { date } = req.query;

    const ticketPipeline = [
      { $match: { status: "confirmed" } },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: "$show" },
      ...(date ? [{ $match: { "show.date": date } }] : []),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          confirmedCount: { $sum: 1 },
          totalSeats: { $sum: { $size: { $ifNull: ["$seats", []] } } },
        },
      },
    ];

    const showFilter = date ? { date } : {};
    const [statsResult, shows] = await Promise.all([
      Ticket.aggregate(ticketPipeline),
      Show.find(showFilter).select("date time"),
    ]);

    const summary = statsResult[0] || {
      totalRevenue: 0,
      confirmedCount: 0,
      totalSeats: 0,
    };

    const now = Date.now();
    const upcomingShowsCount = shows.filter(
      (s) => parseShowDateTime(s.date, s.time).getTime() > now
    ).length;

    res.status(200).json({
      totalRevenue: summary.totalRevenue,
      confirmedCount: summary.confirmedCount,
      totalSeats: summary.totalSeats,
      upcomingShowsCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueByMovie = async (req, res, next) => {
  try {
    const { date } = req.query;

    const result = await Movie.aggregate([
      {
        $lookup: {
          from: "tickets",
          let: { movieId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$movieId", "$$movieId"] },
                status: "confirmed",
              },
            },
            ...(date
              ? [
                  {
                    $lookup: {
                      from: "shows",
                      localField: "showId",
                      foreignField: "_id",
                      as: "show",
                    },
                  },
                  { $unwind: "$show" },
                  { $match: { "show.date": date } },
                ]
              : []),
          ],
          as: "confirmedTickets",
        },
      },
      {
        $project: {
          _id: 0,
          movieId: "$_id",
          title: 1,
          total: { $sum: "$confirmedTickets.total" },
          seats: {
            $sum: {
              $map: {
                input: "$confirmedTickets",
                as: "t",
                in: { $size: { $ifNull: ["$$t.seats", []] } },
              },
            },
          },
        },
      },
      { $sort: { total: -1, title: 1 } },
    ]);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRevenueByDate = async (req, res, next) => {
  try {
    const result = await Ticket.aggregate([
      { $match: { status: "confirmed" } },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: "$show" },
      {
        $group: {
          _id: "$show.date",
          total: { $sum: "$total" },
          ticketsCount: { $sum: 1 },
          seats: { $sum: { $size: { $ifNull: ["$seats", []] } } },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          total: 1,
          ticketsCount: 1,
          seats: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
