import type { APIRoute } from "astro";
import { createHash, timingSafeEqual } from "node:crypto";
import { PASSWORD_HASH, SESSION_SECRET } from "astro:env/server";
import type { ApiResponse, AuthRequest } from "@lib/types";
import { signToken } from "@lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = (await request.json()) as AuthRequest;
    const hashedInput = createHash("sha256").update(body.password).digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const hashesMatch =
      hashedInput.length === PASSWORD_HASH.length &&
      timingSafeEqual(Buffer.from(hashedInput), Buffer.from(PASSWORD_HASH));
    if (!hashesMatch) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid password",
      };
      return new Response(JSON.stringify(response), { status: 401 });
    }

    const payload = `authenticated:${Date.now()}`;
    const token = signToken(payload, SESSION_SECRET);

    cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Authenticated" },
    };
    return new Response(JSON.stringify(response), { status: 200 });
  } catch {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid request",
    };
    return new Response(JSON.stringify(response), { status: 400 });
  }
};
