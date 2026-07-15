// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/project-dashboard", () => ({
  ProjectDashboard: () => <div>Project status dashboard</div>,
}));

describe("Home", () => {
  test("renders the project status dashboard", () => {
    render(<Home />);

    expect(screen.getByText("Project status dashboard")).toBeInTheDocument();
    expect(
      screen.queryByText(/Upload a project snapshot/),
    ).not.toBeInTheDocument();
  });
});
