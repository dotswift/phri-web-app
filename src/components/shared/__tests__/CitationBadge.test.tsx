import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitationBadge } from "../CitationBadge";

describe("CitationBadge", () => {
  const citation = {
    resourceType: "Condition",
    resourceId: "test-id",
    excerpt: "Type 2 Diabetes",
    date: "2024-03-15T00:00:00.000Z",
    source: "Hospital XYZ",
  };

  it("renders the Source badge", () => {
    render(<CitationBadge citation={citation} />);
    expect(screen.getByText("Source")).toBeInTheDocument();
  });

  it("shows popover with citation details on click", async () => {
    const user = userEvent.setup();
    render(<CitationBadge citation={citation} />);

    await user.click(screen.getByText("Source"));

    expect(screen.getByText("Condition")).toBeInTheDocument();
    expect(screen.getByText("Hospital XYZ")).toBeInTheDocument();
    expect(screen.getByText(/"Type 2 Diabetes"/)).toBeInTheDocument();
  });

  it("handles null fields gracefully", () => {
    const sparse = {
      resourceType: "Observation",
      resourceId: "id",
      excerpt: null,
      date: null,
      source: null,
    };
    render(<CitationBadge citation={sparse} />);
    expect(screen.getByText("Source")).toBeInTheDocument();
  });
});
