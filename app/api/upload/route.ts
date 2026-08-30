import { requireApiUser } from "@/lib/api-auth";
import { uploadMedia } from "@/lib/cloudinary";
import { fail, handleError, ok } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireApiUser();
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
