import type { APIRoute } from "astro";
import { createHmac, createHash } from "node:crypto";
import { SESSION_SECRET, ENHANCED_QUALITY_PASSWORD_HASH } from "astro:env/server";
import type { ApiResponse, AuthRequest } from "@lib/types";

function signToken(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if enhanced quality is configured
    if (!ENHANCED_QUALITY_PASSWORD_HASH) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Enhanced quality not configured",
      };
      return new Response(JSON.stringify(response), { status: 403 });
    }

    const body = (await request.json()) as AuthRequest;
    const hashedInput = createHash("sha256").update(body.password).digest("hex");

    if (hashedInput !== ENHANCED_QUALITY_PASSWORD_HASH) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid password",
      };
      return new Response(JSON.stringify(response), { status: 401 });
    }

    const payload = `enhanced-authenticated:${Date.now()}`;
    const token = signToken(payload, SESSION_SECRET);

    cookies.set("enhanced-session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Enhanced access granted" },
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
