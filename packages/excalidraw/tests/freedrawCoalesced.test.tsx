import React from "react";
import { createEvent, fireEvent, render, GlobalTestState } from "./test-utils";
import { Excalidraw } from "../index";
import { UI, Pointer } from "./helpers/ui";
import type { ExcalidrawFreeDrawElement } from "../element/types";

const { h } = window;

/** A pointermove carrying extra stylus samples, as an Apple Pencil produces. */
const penMoveWithSamples = (
  x: number,
  y: number,
  samples: { clientX: number; clientY: number }[],
) => {
  const canvas = GlobalTestState.interactiveCanvas;
  const event = createEvent.pointerMove(canvas, {
    clientX: x,
    clientY: y,
    pointerType: "pen",
    pointerId: 1,
  });
  Object.assign(event, {
    getCoalescedEvents: () =>
      samples.map((sample) => ({ ...sample, pressure: 0.7 })),
  });
  fireEvent(canvas, event);
};

describe("freehand drawing with a stylus", () => {
  it("keeps every coalesced sample of a pointermove", async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
    UI.clickTool("freedraw");

    const pen = new Pointer("pen");
    pen.down(10, 10);
    penMoveWithSamples(40, 10, [
      { clientX: 20, clientY: 12 },
      { clientX: 30, clientY: 14 },
      { clientX: 40, clientY: 10 },
    ]);
    penMoveWithSamples(70, 20, [
      { clientX: 50, clientY: 8 },
      { clientX: 60, clientY: 15 },
      { clientX: 70, clientY: 20 },
    ]);
    pen.up();

    const stroke = h.elements.at(-1) as ExcalidrawFreeDrawElement;
    expect(stroke.type).toBe("freedraw");
    // first point from pointerdown + all six stylus samples
    expect(stroke.points.length).toBeGreaterThanOrEqual(7);
    const xs = stroke.points.map(([x]) => x + stroke.x);
    for (const x of [20, 30, 50, 60]) {
      expect(xs).toContain(x);
    }
  });

  it("still draws from plain pointermoves without samples", async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
    UI.clickTool("freedraw");

    const mouse = new Pointer("mouse");
    mouse.down(10, 10);
    mouse.move(20, 0);
    mouse.move(20, 10);
    mouse.up();

    const stroke = h.elements.at(-1) as ExcalidrawFreeDrawElement;
    expect(stroke.type).toBe("freedraw");
    expect(stroke.points.length).toBeGreaterThanOrEqual(3);
  });
});
