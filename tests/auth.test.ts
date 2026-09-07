import { afterEach, expect, spyOn, test } from "bun:test";
import { MAX_TOKEN_AGE, signToken, verifyToken } from "../src/lib/auth";

const secret = "public-unit-fixture-secret";
const now = 1_800_000_000_000;
let clock: ReturnType<typeof spyOn> | undefined;
afterEach(() => clock?.mockRestore());
test("auth tokens expire at seven days and reject future/tampered payloads", () => {
  clock = spyOn(Date, "now").mockReturnValue(now);
  expect(verifyToken(signToken(`authenticated:${now}`, secret), secret)).toBe(true);
  expect(verifyToken(signToken(`authenticated:${now - MAX_TOKEN_AGE}`, secret), secret)).toBe(true);
  expect(verifyToken(signToken(`authenticated:${now - MAX_TOKEN_AGE - 1}`, secret), secret)).toBe(
    false
  );
  expect(verifyToken(signToken(`authenticated:${now + 1}`, secret), secret)).toBe(false);
  expect(verifyToken(signToken(`authenticated:${now}`, secret), "wrong-secret")).toBe(false);
  for (const value of ["", "one.two.three", "missing.signature", "payload."])
    expect(verifyToken(value, secret)).toBe(false);
});
test("main and enhanced authentication tokens cannot substitute for each other", () => {
  clock = spyOn(Date, "now").mockReturnValue(now);
  expect(verifyToken(signToken(`enhanced-authenticated:${now}`, secret), secret)).toBe(false);
  expect(verifyToken(signToken(`authenticated:${now}junk`, secret), secret)).toBe(false);
  expect(
    verifyToken(
      signToken(`enhanced-authenticated:${now}`, secret),
      secret,
      "enhanced-authenticated"
    )
  ).toBe(true);
  expect(
    verifyToken(signToken(`authenticated:${now}`, secret), secret, "enhanced-authenticated")
  ).toBe(false);
});
