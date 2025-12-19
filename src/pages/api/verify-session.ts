import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET } from "astro:env/server";
import type { ApiResponse } from "@lib/types";

/** Maximum token age: 7 days in milliseconds */
const MAX_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const signaturesMatch = timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    );
    if (!signaturesMatch) return false;
  } catch {
    return false; // Different lengths
  }

  // Validate payload structure and expiration
  const colonIndex = payload.indexOf(":");
  if (colonIndex === -1) return false;
  const timestamp = parseInt(payload.slice(colonIndex + 1), 10);
  if (isNaN(timestamp)) return false;
  const tokenAge = Date.now() - timestamp;
  return tokenAge >= 0 && tokenAge <= MAX_TOKEN_AGE;
}

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get("session")?.value;
  const isValid = sessionCookie ? verifyToken(sessionCookie, SESSION_SECRET) : false;

  const response: ApiResponse<{ valid: boolean }> = {
    success: true,
    data: { valid: isValid },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
