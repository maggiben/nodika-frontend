import { describe, expect, test } from "vitest";
import { emailInitials } from "./email-initials";

describe("emailInitials", () => {
  test("uses the first two letters of the email local part", () => {
    expect(emailInitials("maria@example.com")).toBe("MA");
    expect(emailInitials("ben.maggi@nodika.dev")).toBe("BE");
  });

  test("falls back when the local part has fewer than two letters", () => {
    expect(emailInitials("a@example.com")).toBe("AA");
    expect(emailInitials("1@example.com")).toBe("1@");
  });
});
