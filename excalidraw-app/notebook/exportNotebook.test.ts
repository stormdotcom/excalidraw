import { describe, expect, it } from "vitest";
import { buildPdf } from "./exportNotebook";

// jsdom's Blob has no arrayBuffer()
const text = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(new TextDecoder("latin1").decode(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });

describe("notebook PDF export", () => {
  it("writes one A4 page per image with a valid cross-reference table", async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = await text(
      buildPdf([
        { jpeg, width: 1588, height: 2246 },
        { jpeg, width: 1588, height: 2246 },
      ]),
    );

    expect(pdf.startsWith("%PDF-1.4\n")).toBe(true);
    expect(pdf).toContain("/Count 2");
    expect(pdf.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(pdf).toContain("/MediaBox [0 0 595.28 841.89]");
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);

    // every xref offset must point at the start of its object
    const xrefStart = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(xrefStart, xrefStart + 4)).toBe("xref");
    const entries = pdf
      .slice(xrefStart)
      .split("\n")
      .filter((line) => / 00000 n $/.test(line));
    expect(entries).toHaveLength(8);
    entries.forEach((entry, index) => {
      const offset = Number(entry.slice(0, 10));
      expect(pdf.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
  });
});
