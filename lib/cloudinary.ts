import { v2 as cloudinary } from "cloudinary";
import { env, integrations } from "@/lib/env";
import type { MediaAsset } from "@/lib/types";

let configured = false;
function ensure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
}

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind: MediaAsset["kind"] = file.type.startsWith("video") ? "video" : "image";

  if (!integrations.cloudinary) {
    // Deterministic placeholder so the composer preview still works.
    const seed = `${file.name}-${buffer.length}`.replace(/\W/g, "").slice(0, 24) || "aetheria";
    return {
      id: `mock_${seed}`,
      url: `https://picsum.photos/seed/${seed}/1200/800`,
      width: 1200,
      height: 800,
      kind,
      bytes: buffer.length,
      provider: "mock",
    };
  }

  ensure();
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "aetheria", resource_type: kind === "video" ? "video" : "image" },
        (error, res) => (error || !res ? reject(error) : resolve(res as Record<string, unknown>)),
      )
      .end(buffer);
  });

  return {
    id: String(result.public_id),
    url: String(result.secure_url),
    width: Number(result.width ?? 0),
    height: Number(result.height ?? 0),
    kind,
    bytes: buffer.length,
    provider: "cloudinary",
  };
}
