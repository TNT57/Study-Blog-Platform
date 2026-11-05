import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Regression tests for two real bugs we found while setting up (see docs/learn/00-setup.md).
describe("cn", () => {
  it("removes the earlier class when two classes set the same thing", () => {
    expect(cn("border-transparent", "border-border")).toBe("border-border");
  });

  it("treats our text sizes as sizes, so the text color survives", () => {
    expect(cn("text-white", "text-label")).toBe("text-white text-label");
    expect(cn("text-sm", "text-label")).toBe("text-label");
  });
});

describe("Button", () => {
  it("keeps the white text on the primary button", () => {
    render(<Button>Publish</Button>);

    const button = screen.getByRole("button", { name: "Publish" });
    expect(button).toHaveClass("text-primary-foreground", "text-label", "h-11");
    expect(button).not.toHaveClass("text-sm");
  });

  it("gives the outline variant a visible border", () => {
    const classes = cn(buttonVariants({ variant: "outline" })).split(" ");

    expect(classes).toContain("border-border");
    expect(classes).not.toContain("border-transparent");
  });
});
