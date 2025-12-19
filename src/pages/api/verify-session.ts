import type { APIRoute } from "astro";
import { SESSION_SECRET } from "astro:env/server";
import type { ApiResponse } from "@lib/types";
import { verifyToken } from "@lib/auth";

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
