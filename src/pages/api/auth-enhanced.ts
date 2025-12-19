/**
 * @fileoverview Authentication endpoint for enhanced-quality model access.
 * Validates a password against the configured hash and issues a signed session cookie.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @route POST /api/auth-enhanced
 */

import type { APIRoute } from "astro";
import { createHash, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET, ENHANCED_QUALITY_PASSWORD_HASH } from "astro:env/server";
import type { ApiResponse, AuthRequest } from "@lib/types";
import { signToken } from "@lib/auth";

/**
 * Authenticates user for enhanced-quality model access.
 * Issues a 7-day session cookie on successful authentication.
 *
 * @returns 200 with success message on valid password
 * @returns 401 on invalid password
 * @returns 403 if enhanced quality is not configured
 * @returns 400 on malformed request
 */
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

    // Use timing-safe comparison to prevent timing attacks
    const hashesMatch = timingSafeEqual(
      Buffer.from(hashedInput, "hex"),
      Buffer.from(ENHANCED_QUALITY_PASSWORD_HASH, "hex")
    );

    if (!hashesMatch) {
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
