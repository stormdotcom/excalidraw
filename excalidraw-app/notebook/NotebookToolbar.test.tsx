import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotebookToolbar } from "./NotebookToolbar";

describe("NotebookToolbar palettes", () => {
  it("switches between modern ink sets and selects a colour", () => {
    const onColor = vi.fn();
    render(
      <NotebookToolbar
        tool="pencil"
        pencilColor="#1e1e1e"
        highlighterColor="#ffe066"
        onTool={vi.fn()}
        onColor={onColor}
        onFit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Earth palette"));
    expect(
      screen.getByRole("radiogroup", { name: "Earth pencil colours" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Terracotta" }));
    expect(onColor).toHaveBeenCalledWith("#9a3412");
  });

  it("offers dedicated highlighter palettes", () => {
    render(
      <NotebookToolbar
        tool="highlighter"
        pencilColor="#1e1e1e"
        highlighterColor="#ffe066"
        onTool={vi.fn()}
        onColor={vi.fn()}
        onFit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Sorbet palette"));
    expect(
      screen.getByRole("radiogroup", { name: "Sorbet highlighter colours" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dragon fruit" })).toBeVisible();
  });
});
