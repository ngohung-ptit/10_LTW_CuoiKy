export const posterSrc = (poster = "interstellar.jpg") =>
  poster.startsWith("data:image/jpeg;") ? poster : `/assets/images/${poster}`;

export const posterSrcSet = (poster) =>
  poster.startsWith("data:")
    ? undefined
    : `/assets/images/${poster.replace(/\.jpg$/, "-small.jpg")} 342w, ${posterSrc(poster)} 500w`;

export const readJpegPoster = async (file) => {
  if (!/\.jpe?g$/i.test(file.name) || (file.type && file.type !== "image/jpeg")) {
    throw new Error("Vui lòng chọn ảnh JPG hoặc JPEG.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ảnh không được lớn hơn 5 MB.");
  }
  const signature = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (signature[0] !== 0xff || signature[1] !== 0xd8 || signature[2] !== 0xff) {
    throw new Error("Tệp không phải ảnh JPEG hợp lệ.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 800 / image.naturalWidth, 1200 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    throw new Error("Không đọc được ảnh. Vui lòng chọn ảnh JPG khác.");
  } finally {
    URL.revokeObjectURL(url);
  }
};
