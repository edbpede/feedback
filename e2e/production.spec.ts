import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";

test("every executable inline script is allowed by the production CSP", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("<title>");
  const csp = response.headers()["content-security-policy"];
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    (match) => !/type=["'](?:application\/json|application\/ld\+json)["']/.test(match[1])
  );
  expect(scripts.length).toBeGreaterThanOrEqual(3);
  for (const script of scripts) {
    const hash = createHash("sha256").update(script[2]).digest("base64");
    expect(csp).toContain(`'sha256-${hash}'`);
  }
});
test("production authentication rejects missing sessions and accepts only fixture credentials", async ({
  request,
}) => {
  expect((await request.post("/api/chat", { data: { messages: [] } })).status()).toBe(401);
  expect((await request.post("/api/pii-detect", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/auth", { data: { password: "wrong" } })).status()).toBe(401);
  const login = await request.post("/api/auth", { data: { password: "ci-password" } });
  expect(login.status()).toBe(200);
  const cookie = login.headers()["set-cookie"];
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie.toLowerCase()).toContain("samesite=strict");
  const headers = { Cookie: cookie.split(";")[0] };
  expect((await (await request.get("/api/verify-session", { headers })).json()).data.valid).toBe(
    true
  );
  const pii = await request.post("/api/pii-detect", {
    headers,
    data: { model: "gpt-5.1", text: "Only synthetic fixture text" },
  });
  expect(pii.status()).toBe(400);
  const copied = { Cookie: cookie.split(";")[0].replace("session=", "enhanced-session=") };
  expect(
    (await (await request.get("/api/check-enhanced", { headers: copied })).json()).data
      .authenticated
  ).toBe(false);
});
test("the built Svelte island hydrates under CSP and completes the password gate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy|Refused to/.test(message.text()))
      violations.push(message.text());
  });
  await page.route("**/*", async (route) => {
    if (new URL(route.request().url()).hostname === "127.0.0.1") await route.continue();
    else await route.abort();
  });
  await page.goto("/");
  const input = page.locator('input[type="password"]');
  await expect(input).toBeVisible();
  await input.fill("ci-password");
  await page.locator('button[type="submit"]').click();
  await expect(input).toHaveCount(0);
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(violations).toEqual([]);
});
