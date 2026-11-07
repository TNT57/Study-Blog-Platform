import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostCard } from "@/components/post-card";

const post = {
  id: 7,
  title: "<script>alert('hi')</script> is just text",
  excerpt: "React escapes text, so tags are shown, never run.",
  authorUsername: "trung",
  createdAt: new Date("2026-11-03T10:00:00Z"),
};

describe("PostCard", () => {
  it("links the title to the post", () => {
    render(<PostCard post={post} />);

    expect(screen.getByRole("link", { name: post.title })).toHaveAttribute(
      "href",
      "/posts/7",
    );
  });

  it("shows the author and the date", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("trung")).toBeInTheDocument();
    expect(screen.getByText("3 Nov 2026")).toHaveAttribute(
      "datetime",
      "2026-11-03T10:00:00.000Z",
    );
  });

  it("shows HTML in a title as text, not as HTML", () => {
    const { container } = render(<PostCard post={post} />);

    expect(container.querySelector("script")).toBeNull();
  });
});
