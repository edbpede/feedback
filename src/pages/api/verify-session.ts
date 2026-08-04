import { SESSION_SECRET } from "astro:env/server";
import { verifyToken } from "@lib/auth";
import type { ApiResponse } from "@lib/types";
import type { APIRoute } from "astro";

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
