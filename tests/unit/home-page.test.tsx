import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("shows the main heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Write what you learn. Track how you focus.",
      }),
    ).toBeInTheDocument();
  });

  it("links to the learning notes", () => {
    render(<HomePage />);

    const link = screen.getByRole("link", { name: "Read the learning notes" });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/TNT57/Study-Blog-Platform/tree/main/docs/learn",
    );
  });

  it("draws the learning-notes link with a visible border", () => {
    render(<HomePage />);

    const link = screen.getByRole("link", { name: "Read the learning notes" });
    expect(link).toHaveClass("border-border");
    expect(link).not.toHaveClass("border-transparent");
  });
});
