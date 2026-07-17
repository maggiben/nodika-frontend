import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";

import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";
import { isPublicAuthPath, proxy } from "@/proxy";

function requestFor(pathname: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new NextRequest(new URL(pathname, "https://example.com"), {
    headers,
  });
}

describe("isPublicAuthPath", () => {
  test("allows account routes and rejects app routes", () => {
    expect(isPublicAuthPath("/es/login")).toBe(true);
    expect(isPublicAuthPath("/en/register")).toBe(true);
    expect(isPublicAuthPath("/es/forgot-password")).toBe(true);
    expect(isPublicAuthPath("/es")).toBe(false);
    expect(isPublicAuthPath("/es/upload")).toBe(false);
    expect(isPublicAuthPath("/es/staff")).toBe(false);
  });
});

describe("proxy auth redirect", () => {
  test("redirects unsigned home to login", () => {
    const response = proxy(requestFor("/es"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/es/login",
    );
  });

  test("allows unsigned login and register", () => {
    expect(proxy(requestFor("/es/login")).status).toBe(200);
    expect(proxy(requestFor("/en/register")).status).toBe(200);
  });

  test("allows signed-in home", () => {
    const response = proxy(
      requestFor("/es", `${CORE_ACCESS_COOKIE}=token-value`),
    );
    expect(response.status).toBe(200);
  });

  test("redirects unsigned upload to login", () => {
    const response = proxy(requestFor("/es/upload"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/es/login",
    );
  });
});
