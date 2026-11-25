export const parsePagination = (query = {}) => {
  const hasPagination = query.page !== undefined || query.limit !== undefined;
  if (!hasPagination) return null;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginatedResponse = (items, total, { page, limit }) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  },
});

export const parseShowDateTime = (date, time) =>
  new Date(`${date}T${time}:00+07:00`);
