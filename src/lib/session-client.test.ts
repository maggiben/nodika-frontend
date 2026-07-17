import { afterEach, describe, expect, test, vi } from "vitest";

import {
  isHomePath,
  isPublicAuthPath,
  localeFromPathname,
  redirectToLoginIfUnauthorized,
} from "./session-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session-client", () => {
  test("detects public auth paths and home", () => {
    expect(isPublicAuthPath("/es/login")).toBe(true);
    expect(isPublicAuthPath("/en/register")).toBe(true);
    expect(isPublicAuthPath("/es")).toBe(false);
    expect(isPublicAuthPath("/es/settings")).toBe(false);
    expect(isHomePath("/es")).toBe(true);
    expect(isHomePath("/es/")).toBe(true);
    expect(isHomePath("/es/settings")).toBe(false);
    expect(localeFromPathname("/en/staff")).toBe("en");
    expect(localeFromPathname("/unknown")).toBe("es");
  });

  test("redirects to login on 401 outside public auth routes", () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/es/settings", assign },
    });

    expect(
      redirectToLoginIfUnauthorized(new Response(null, { status: 401 })),
    ).toBe(true);
    expect(assign).toHaveBeenCalledWith("/es/login");
  });

  test("does not redirect on non-401", () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/es/settings", assign },
    });

    expect(
      redirectToLoginIfUnauthorized(new Response(null, { status: 500 })),
    ).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });

  test("does not redirect on public auth paths", () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/es/login", assign },
    });

    expect(
      redirectToLoginIfUnauthorized(new Response(null, { status: 401 })),
    ).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });
});
