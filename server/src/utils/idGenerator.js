export const slugify = (text) =>
  (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const escapeRegex = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildMovieBaseId = (title) =>
  (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .match(/[a-z0-9]+/)?.[0] || "";

export const buildRoomBaseId = (name) => {
  const numMatch = (name || "").match(/\d+/);
  if (numMatch) {
    return `room-${parseInt(numMatch[0], 10)}`;
  }
  const clean = slugify(name).replace(/^phong-?/, "");
  return clean ? `room-${clean}` : "room";
};

export const buildShowBaseId = ({ date, movieId, roomId }) => {
  const roomSuffix = (roomId || "").replace(/^room-?/, "") || roomId;
  return `${date}-${movieId}-${roomSuffix}`;
};

export const buildUserBaseId = ({ email, name, role }) => {
  const localPart = slugify((email || "").split("@")[0]);
  if (localPart) {
    return `udu-${localPart}`;
  }
  const nameSlug = slugify(name);
  if (nameSlug) {
    return `udu-${nameSlug}`;
  }
  return `udu-${role || "user"}`;
};

export const generateUniqueId = async (baseId, findById) => {
  let candidate = baseId;
  let counter = 2;
  while (await findById(candidate)) {
    candidate = `${baseId}-${counter}`;
    counter++;
  }
  return candidate;
};
