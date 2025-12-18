import type { APIRoute } from "astro";
import { createHmac } from "node:crypto";
import { SESSION_SECRET } from "astro:env/server";
import type { ApiResponse } from "@lib/types";

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  return signature === expectedSignature;
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
