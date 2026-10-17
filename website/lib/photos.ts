export const MAX_PHOTOS = 8;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];

export type PhotoPayload = {
  filename: string;
  contentType: AllowedType;
  dataBase64: string;
};

function isAllowed(type: string): type is AllowedType {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

// Downscales an image so its longest side is at most MAX_DIMENSION, re-encoded as JPEG.
async function resizeToJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Could not read "${file.name}" as an image.`);
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error(`Could not process "${file.name}".`)),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

// Reads a Blob and returns its base64 content without the data: prefix.
function blobToBase64(blob: Blob, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read "${name}".`));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

// Converts a browser File into a resized JPEG in the shape the intake API expects.
export async function fileToPhoto(file: File): Promise<PhotoPayload> {
  if (!isAllowed(file.type)) {
    throw new Error(`"${file.name}" is not a JPEG, PNG, or WebP image.`);
  }
  const blob = await resizeToJpeg(file);
  const dataBase64 = await blobToBase64(blob, file.name);
  const filename = /\.\w+$/.test(file.name)
    ? file.name.replace(/\.\w+$/, ".jpg")
    : `${file.name}.jpg`;
  return { filename, contentType: "image/jpeg", dataBase64 };
}
