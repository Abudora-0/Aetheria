import { requireApiUser } from "@/lib/api-auth";
import { uploadMedia } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { fail, handleError, ok, tooMany } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const gate = rateLimit(`upload:${user.id}`, 20, 60_000);
    if (!gate.ok) return tooMany(gate.retryAfterSeconds);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided", 422);
    if (file.size > MAX_BYTES) return fail("Files must be 12 MB or smaller", 413);
    if (!/^image\/|^video\//.test(file.type)) return fail("Only images and video are supported", 415);

    const asset = await uploadMedia(file);
    return ok({ asset });
  } catch (err) {
    return handleError(err);
  }
}
