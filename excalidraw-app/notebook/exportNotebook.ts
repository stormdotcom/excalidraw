import { exportToCanvas } from "../../packages/excalidraw";
import { newFrameElement } from "../../packages/excalidraw/element/newElement";
import { A4 } from "./model";
import type { Notebook, NotePage } from "./model";

/** Export resolution: 2× the 96-dpi page, ≈192 dpi. */
const EXPORT_SCALE = 2;

// Must match the SVG paper drawn by PageEditor.
const RULES = { x: 36, y: 56, width: 722, height: 1010, dx: 24, dy: 28 };
const PAPER_COLOR = "#ffffff";
const RULE_COLOR = "#dde3ea";

const drawPaper = (
  ctx: CanvasRenderingContext2D,
  paper: NotePage["paper"],
  scale: number,
) => {
  ctx.fillStyle = PAPER_COLOR;
  ctx.fillRect(0, 0, A4.width * scale, A4.height * scale);
  if (paper === "blank") {
    return;
  }
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = RULE_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const right = RULES.x + RULES.width;
  const bottom = RULES.y + RULES.height;
  for (let y = RULES.y + RULES.dy - 0.5; y <= bottom; y += RULES.dy) {
    ctx.moveTo(RULES.x, y);
    ctx.lineTo(right, y);
  }
  if (paper === "grid") {
    for (let x = RULES.x + RULES.dx - 0.5; x <= right; x += RULES.dx) {
      ctx.moveTo(x, RULES.y);
      ctx.lineTo(x, bottom);
    }
  }
  ctx.stroke();
  ctx.restore();
};

/**
 * Renders one page as printed: A4 paper with its rules plus the ink, always
 * in light colours. Ink outside the A4 sheet is cropped.
 */
export const renderPageToCanvas = async (
  page: NotePage,
  scale = EXPORT_SCALE,
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  canvas.width = A4.width * scale;
  canvas.height = A4.height * scale;
  const ctx = canvas.getContext("2d")!;
  drawPaper(ctx, page.paper, scale);

  const elements = page.elements.filter((element) => !element.isDeleted);
  if (elements.length) {
    const sheet = newFrameElement({ x: 0, y: 0, ...A4 });
    const ink = await exportToCanvas({
      elements,
      files: page.files,
      appState: {
        exportBackground: false,
        exportWithDarkMode: false,
        viewBackgroundColor: PAPER_COLOR,
      },
      exportingFrame: sheet,
      getDimensions: (width, height) => ({
        width: width * scale,
        height: height * scale,
        scale,
      }),
    });
    ctx.drawImage(ink, 0, 0);
  }
  return canvas;
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't render the page.")),
      type,
      quality,
    ),
  );

// --------------------------------------------------------------------- PDF --

const A4_POINTS = { width: 595.28, height: 841.89 };

/**
 * Minimal PDF writer: one A4 page per JPEG, no dependencies (the notes page
 * must work offline and its content policy blocks CDNs).
 */
export const buildPdf = (
  images: { jpeg: Uint8Array; width: number; height: number }[],
): Blob => {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const write = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: string, stream?: Uint8Array) => {
    offsets[id] = length;
    write(`${id} 0 obj\n${body}\n`);
    if (stream) {
      write("stream\n");
      write(stream);
      write("\nendstream\n");
    }
    write("endobj\n");
  };

  // header + binary marker so tools treat the file as binary
  write("%PDF-1.4\n");
  write(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // objects: 1 catalog, 2 page tree, then per page: page, content, image
  const pageId = (index: number) => 3 + index * 3;
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(
    2,
    `<< /Type /Pages /Kids [${images
      .map((_, index) => `${pageId(index)} 0 R`)
      .join(" ")}] /Count ${images.length} >>`,
  );
  const { width: W, height: H } = A4_POINTS;
  images.forEach((image, index) => {
    const id = pageId(index);
    object(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${
        id + 2
      } 0 R >> >> /Contents ${id + 1} 0 R >>`,
    );
    const content = encoder.encode(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`);
    object(id + 1, `<< /Length ${content.length} >>`, content);
    object(
      id + 2,
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>`,
      image.jpeg,
    );
  });

  const count = 3 + images.length * 3;
  const xref = length;
  write(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) {
    write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  write(
    `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );

  return new Blob(chunks, { type: "application/pdf" });
};

// ---------------------------------------------------------------- download --

const safeName = (title: string) =>
  title.trim().replace(/[^a-z0-9 _-]/gi, "_") || "note";

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** On phones/tablets hand files to the share sheet (e.g. Save to Photos). */
const shareFiles = async (files: File[]) => {
  const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
  if (!isTouch || !navigator.canShare?.({ files })) {
    return false;
  }
  try {
    await navigator.share({ files });
    return true;
  } catch (error) {
    // the user closing the share sheet isn't a failure
    return (error as DOMException)?.name === "AbortError";
  }
};

export type ExportFormat = "pdf" | "png";

/** Exports the chosen pages (indexes into note.pages) as one PDF or PNGs. */
export const exportNotebook = async (
  note: Notebook,
  pageIndexes: number[],
  format: ExportFormat,
) => {
  const base = safeName(note.title);
  const pages = pageIndexes.map((index) => note.pages[index]);
  const canvases: HTMLCanvasElement[] = [];
  for (const page of pages) {
    canvases.push(await renderPageToCanvas(page));
  }

  if (format === "pdf") {
    const images = [];
    for (const canvas of canvases) {
      const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
      images.push({
        jpeg: new Uint8Array(await jpeg.arrayBuffer()),
        width: canvas.width,
        height: canvas.height,
      });
    }
    const pdf = buildPdf(images);
    const file = new File([pdf], `${base}.pdf`, { type: "application/pdf" });
    if (!(await shareFiles([file]))) {
      download(pdf, file.name);
    }
    return;
  }

  const files: File[] = [];
  for (let i = 0; i < canvases.length; i++) {
    const png = await canvasToBlob(canvases[i], "image/png");
    const name =
      canvases.length === 1 && note.pages.length === 1
        ? `${base}.png`
        : `${base} - page ${pageIndexes[i] + 1}.png`;
    files.push(new File([png], name, { type: "image/png" }));
  }
  if (await shareFiles(files)) {
    return;
  }
  // one download per page; browsers may ask once to allow several downloads
  for (const file of files) {
    download(file, file.name);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
};
