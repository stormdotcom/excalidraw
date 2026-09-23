import { convertToExcalidrawElements } from "../../packages/excalidraw";
import type { ExcalidrawElementSkeleton } from "../../packages/excalidraw/data/transform";
import type { ExcalidrawElement } from "../../packages/excalidraw/element/types";
import type {
  ExcalidrawImperativeAPI,
  LibraryItem,
  LibraryItems,
} from "../../packages/excalidraw/types";

/**
 * Built-in "Draw kit": ready-made system design & workflow elements that are
 * added to the user's library once per KIT_VERSION.
 */
const KIT_VERSION = 1;
const KIT_ID_PREFIX = "draw-kit:";
const KIT_STORAGE_KEY = "draw-kit-version";

const C = {
  blue: { strokeColor: "#1971c2", backgroundColor: "#a5d8ff" },
  green: { strokeColor: "#2f9e44", backgroundColor: "#b2f2bb" },
  orange: { strokeColor: "#f08c00", backgroundColor: "#ffec99" },
  red: { strokeColor: "#e03131", backgroundColor: "#ffc9c9" },
  violet: { strokeColor: "#6741d9", backgroundColor: "#d0bfff" },
  gray: { strokeColor: "#495057", backgroundColor: "#e9ecef" },
  yellow: { strokeColor: "#f08c00", backgroundColor: "#fff3bf" },
} as const;

type Color = typeof C[keyof typeof C];

const base = (color: Color) => ({
  ...color,
  fillStyle: "solid" as const,
  strokeWidth: 2,
  roughness: 1,
});

const box = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
  text?: string,
  extra: Record<string, unknown> = {},
): ExcalidrawElementSkeleton => ({
  type: "rectangle",
  x,
  y,
  width,
  height,
  roundness: { type: 3 },
  ...base(color),
  ...(text ? { label: { text, fontSize: 16 } } : {}),
  ...extra,
});

const oval = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
  text?: string,
): ExcalidrawElementSkeleton => ({
  type: "ellipse",
  x,
  y,
  width,
  height,
  ...base(color),
  ...(text ? { label: { text, fontSize: 16 } } : {}),
});

/** open or closed polyline; closed paths (first point === last) get filled */
const path = (
  x: number,
  y: number,
  points: [number, number][],
  color: Color,
  extra: Record<string, unknown> = {},
): ExcalidrawElementSkeleton =>
  ({
    type: "line",
    x,
    y,
    points,
    ...base(color),
    ...extra,
  } as ExcalidrawElementSkeleton);

/** caption; `cx` is the horizontal center (fixed up after measuring) */
const caption = (
  cx: number,
  y: number,
  text: string,
  fontSize = 16,
): ExcalidrawElementSkeleton =>
  ({
    type: "text",
    x: cx,
    y,
    text,
    fontSize,
    textAlign: "center",
    strokeColor: "#1e1e1e",
    customData: { drawKitCenterX: cx },
  } as ExcalidrawElementSkeleton);

type KitItem = {
  key: string;
  name: string;
  skeleton: ExcalidrawElementSkeleton[];
};

const SYSTEM = "System design";
const FLOW = "Workflow";

const BASICS = "Basics";

const connector = (
  key: string,
  name: string,
  type: "line" | "arrow",
  extra: Record<string, unknown> = {},
): KitItem => ({
  key,
  name: `${BASICS} · ${name}`,
  skeleton: [
    {
      type,
      x: 0,
      y: 0,
      width: 200,
      height: 0,
      strokeColor: "#1e1e1e",
      strokeWidth: 2,
      ...extra,
    } as ExcalidrawElementSkeleton,
  ],
});

const KIT: KitItem[] = [
  // ----------------------------------------------------------------- basics
  connector("line", "Line", "line"),
  connector("arrow", "Arrow", "arrow"),
  connector("flow-arrow", "Running / data-flow arrow (dashed)", "arrow", {
    strokeStyle: "dashed",
    strokeColor: "#1971c2",
  }),
  connector("dotted-arrow", "Dotted arrow (optional / async)", "arrow", {
    strokeStyle: "dotted",
  }),
  {
    key: "square",
    name: `${BASICS} · Square box`,
    skeleton: [box(0, 0, 120, 120, C.gray, "Box")],
  },
  // ---------------------------------------------------------- system design
  {
    key: "user",
    name: `${SYSTEM} · User / client`,
    skeleton: [
      oval(22, 0, 36, 36, C.blue),
      path(
        40,
        36,
        [
          [0, 0],
          [0, 50],
        ],
        C.blue,
      ),
      path(
        10,
        52,
        [
          [0, 0],
          [60, 0],
        ],
        C.blue,
      ),
      path(
        18,
        86,
        [
          [22, 0],
          [0, 40],
        ],
        C.blue,
      ),
      path(
        40,
        86,
        [
          [0, 0],
          [22, 40],
        ],
        C.blue,
      ),
      caption(40, 136, "User"),
    ],
  },
  {
    key: "web-app",
    name: `${SYSTEM} · Browser / web app`,
    skeleton: [
      box(0, 0, 160, 110, C.blue),
      path(
        0,
        24,
        [
          [0, 0],
          [160, 0],
        ],
        C.blue,
      ),
      oval(10, 8, 9, 9, C.red),
      oval(24, 8, 9, 9, C.orange),
      oval(38, 8, 9, 9, C.green),
      caption(80, 56, "Browser"),
    ],
  },
  {
    key: "mobile-app",
    name: `${SYSTEM} · Mobile app`,
    skeleton: [
      box(0, 0, 70, 120, C.blue),
      path(
        22,
        108,
        [
          [0, 0],
          [26, 0],
        ],
        C.blue,
      ),
      caption(35, 128, "Mobile app"),
    ],
  },
  {
    key: "load-balancer",
    name: `${SYSTEM} · Load balancer`,
    skeleton: [oval(0, 0, 150, 80, C.violet, "Load balancer")],
  },
  {
    key: "api-gateway",
    name: `${SYSTEM} · API gateway`,
    skeleton: [box(0, 0, 170, 64, C.violet, "API Gateway")],
  },
  {
    key: "service",
    name: `${SYSTEM} · Service / microservice`,
    skeleton: [box(0, 0, 160, 80, C.blue, "Service")],
  },
  {
    key: "server",
    name: `${SYSTEM} · Server rack`,
    skeleton: [
      box(0, 0, 120, 120, C.gray, undefined, { roundness: null }),
      path(
        0,
        40,
        [
          [0, 0],
          [120, 0],
        ],
        C.gray,
      ),
      path(
        0,
        80,
        [
          [0, 0],
          [120, 0],
        ],
        C.gray,
      ),
      oval(98, 15, 10, 10, C.green),
      oval(98, 55, 10, 10, C.green),
      oval(98, 95, 10, 10, C.green),
      caption(60, 130, "Server"),
    ],
  },
  {
    key: "system",
    name: `${SYSTEM} · System / computer / desktop`,
    skeleton: [
      box(0, 0, 160, 100, C.gray, undefined, { roundness: null }),
      box(10, 10, 140, 80, C.blue, undefined, { roundness: null }),
      path(
        70,
        100,
        [
          [0, 0],
          [-8, 26],
        ],
        C.gray,
      ),
      path(
        90,
        100,
        [
          [0, 0],
          [8, 26],
        ],
        C.gray,
      ),
      path(
        44,
        126,
        [
          [0, 0],
          [72, 0],
        ],
        C.gray,
      ),
      caption(80, 134, "System"),
    ],
  },
  {
    key: "ui-screen",
    name: `${SYSTEM} · UI screen (wireframe)`,
    skeleton: [
      box(0, 0, 170, 130, C.gray, undefined, { backgroundColor: "#ffffff" }),
      box(12, 12, 146, 16, C.gray, undefined, { roundness: null }),
      box(12, 40, 146, 24, C.gray, undefined, {
        roundness: null,
        backgroundColor: "#ffffff",
      }),
      box(12, 74, 146, 24, C.gray, undefined, {
        roundness: null,
        backgroundColor: "#ffffff",
      }),
      box(86, 106, 72, 16, C.violet),
      caption(85, 140, "UI"),
    ],
  },
  {
    key: "server-cluster",
    name: `${SYSTEM} · Servers (cluster)`,
    skeleton: [
      box(28, 0, 110, 80, C.gray, undefined, { roundness: null }),
      box(14, 14, 110, 80, C.gray, undefined, { roundness: null }),
      box(0, 28, 110, 80, C.gray, undefined, { roundness: null }),
      path(
        0,
        68,
        [
          [0, 0],
          [110, 0],
        ],
        C.gray,
      ),
      oval(90, 44, 10, 10, C.green),
      oval(90, 84, 10, 10, C.green),
      caption(69, 118, "Servers"),
    ],
  },
  {
    key: "database",
    name: `${SYSTEM} · Database`,
    skeleton: [
      // bottom rim, body fill (no outline), sides, then top lid
      oval(0, 90, 130, 36, C.green),
      box(0, 18, 130, 90, C.green, undefined, {
        roundness: null,
        strokeColor: "transparent",
      }),
      path(
        0,
        18,
        [
          [0, 0],
          [0, 90],
        ],
        C.green,
      ),
      path(
        130,
        18,
        [
          [0, 0],
          [0, 90],
        ],
        C.green,
      ),
      oval(0, 0, 130, 36, C.green),
      caption(65, 58, "Database"),
    ],
  },
  {
    key: "cache",
    name: `${SYSTEM} · Cache (Redis, Memcached)`,
    skeleton: [box(0, 0, 140, 64, C.red, "Cache")],
  },
  {
    key: "queue",
    name: `${SYSTEM} · Message queue / event stream`,
    skeleton: [
      box(0, 0, 200, 60, C.orange, undefined, { roundness: null }),
      path(
        50,
        0,
        [
          [0, 0],
          [0, 60],
        ],
        C.orange,
      ),
      path(
        100,
        0,
        [
          [0, 0],
          [0, 60],
        ],
        C.orange,
      ),
      path(
        150,
        0,
        [
          [0, 0],
          [0, 60],
        ],
        C.orange,
      ),
      caption(100, 70, "Message queue"),
    ],
  },
  {
    key: "storage",
    name: `${SYSTEM} · Object storage / bucket`,
    skeleton: [
      path(
        0,
        0,
        [
          [0, 0],
          [130, 0],
          [112, 100],
          [18, 100],
          [0, 0],
        ],
        C.orange,
      ),
      caption(65, 110, "Object storage"),
    ],
  },
  {
    key: "cloud",
    name: `${SYSTEM} · CDN / cloud / internet`,
    skeleton: [
      path(
        0,
        0,
        [
          [30, 90],
          [0, 62],
          [18, 30],
          [55, 26],
          [80, 0],
          [122, 8],
          [140, 32],
          [178, 38],
          [190, 70],
          [168, 92],
          [30, 90],
        ],
        C.blue,
        { roundness: { type: 2 } },
      ),
      caption(96, 48, "CDN / Cloud"),
    ],
  },
  {
    key: "external-api",
    name: `${SYSTEM} · External / third-party API`,
    skeleton: [
      box(0, 0, 170, 64, C.gray, "External API", { strokeStyle: "dashed" }),
    ],
  },
  {
    key: "worker",
    name: `${SYSTEM} · Background worker / cron job`,
    skeleton: [box(0, 0, 170, 64, C.green, "Worker / Cron")],
  },
  {
    key: "request-arrow",
    name: `${SYSTEM} · Labelled request arrow`,
    skeleton: [
      {
        type: "arrow",
        x: 0,
        y: 0,
        width: 200,
        height: 0,
        strokeColor: "#1e1e1e",
        strokeWidth: 2,
        label: { text: "HTTPS", fontSize: 14 },
      } as ExcalidrawElementSkeleton,
    ],
  },
  // --------------------------------------------------------------- workflow
  {
    key: "start",
    name: `${FLOW} · Start (terminator)`,
    skeleton: [oval(0, 0, 150, 64, C.green, "Start")],
  },
  {
    key: "end",
    name: `${FLOW} · End (terminator)`,
    skeleton: [oval(0, 0, 150, 64, C.red, "End")],
  },
  {
    key: "process",
    name: `${FLOW} · Process step`,
    skeleton: [box(0, 0, 170, 72, C.blue, "Process")],
  },
  {
    key: "decision",
    name: `${FLOW} · Decision`,
    skeleton: [
      {
        type: "diamond",
        x: 0,
        y: 0,
        width: 170,
        height: 120,
        ...base(C.orange),
        label: { text: "Decision?", fontSize: 16 },
      } as ExcalidrawElementSkeleton,
    ],
  },
  {
    key: "io",
    name: `${FLOW} · Input / output (data)`,
    skeleton: [
      path(
        0,
        0,
        [
          [24, 0],
          [180, 0],
          [156, 72],
          [0, 72],
          [24, 0],
        ],
        C.violet,
      ),
      caption(90, 26, "Input / Output"),
    ],
  },
  {
    key: "document",
    name: `${FLOW} · Document`,
    skeleton: [
      path(
        0,
        0,
        [
          [0, 0],
          [160, 0],
          [160, 76],
          [120, 68],
          [80, 80],
          [40, 92],
          [0, 82],
          [0, 0],
        ],
        C.gray,
      ),
      caption(80, 28, "Document"),
    ],
  },
  {
    key: "subprocess",
    name: `${FLOW} · Subprocess / predefined step`,
    skeleton: [
      box(0, 0, 180, 72, C.blue, undefined, { roundness: null }),
      path(
        16,
        0,
        [
          [0, 0],
          [0, 72],
        ],
        C.blue,
      ),
      path(
        164,
        0,
        [
          [0, 0],
          [0, 72],
        ],
        C.blue,
      ),
      caption(90, 26, "Subprocess"),
    ],
  },
  {
    key: "branch",
    name: `${FLOW} · Yes / No branch`,
    skeleton: [
      {
        type: "diamond",
        x: 70,
        y: 0,
        width: 140,
        height: 100,
        ...base(C.orange),
        label: { text: "OK?", fontSize: 16 },
      } as ExcalidrawElementSkeleton,
      {
        type: "arrow",
        x: 70,
        y: 50,
        points: [
          [0, 0],
          [-70, 0],
          [-70, 80],
        ],
        strokeColor: "#2f9e44",
        strokeWidth: 2,
        label: { text: "Yes", fontSize: 14 },
      } as ExcalidrawElementSkeleton,
      {
        type: "arrow",
        x: 210,
        y: 50,
        points: [
          [0, 0],
          [70, 0],
          [70, 80],
        ],
        strokeColor: "#e03131",
        strokeWidth: 2,
        label: { text: "No", fontSize: 14 },
      } as ExcalidrawElementSkeleton,
    ],
  },
  {
    key: "swimlane",
    name: `${FLOW} · Swimlane (team / actor lane)`,
    skeleton: [
      box(0, 0, 520, 40, C.gray, "Lane: Team", { roundness: null }),
      box(0, 40, 520, 150, C.gray, undefined, {
        roundness: null,
        backgroundColor: "transparent",
      }),
    ],
  },
  {
    key: "note",
    name: `${FLOW} · Sticky note`,
    skeleton: [
      box(0, 0, 170, 150, C.yellow, "Note", {
        roundness: null,
        strokeColor: "#fab005",
      }),
    ],
  },
];

const toLibraryItem = (item: KitItem, created: number): LibraryItem => {
  const elements = convertToExcalidrawElements(item.skeleton).map((element) => {
    const centerX = element.customData?.drawKitCenterX;
    if (element.type === "text" && typeof centerX === "number") {
      const { customData, ...rest } = element;
      return { ...rest, x: centerX - element.width / 2 } as ExcalidrawElement;
    }
    return element;
  });
  const groupId = `${KIT_ID_PREFIX}${item.key}`;
  return {
    id: `${KIT_ID_PREFIX}${item.key}`,
    status: "unpublished",
    name: item.name,
    created,
    elements: elements.map((element) => ({
      ...element,
      groupIds: [groupId],
    })),
  };
};

export const getDrawKitItems = (): LibraryItem[] => {
  const now = Date.now();
  return KIT.map((item, idx) => toLibraryItem(item, now - idx));
};

/**
 * Adds (or refreshes) the Draw kit in the user's library once per kit
 * version. Items the user deleted stay deleted until the next version.
 */
export const ensureDrawKitInLibrary = async (
  excalidrawAPI: ExcalidrawImperativeAPI,
) => {
  try {
    if (localStorage.getItem(KIT_STORAGE_KEY) === String(KIT_VERSION)) {
      return;
    }
  } catch {
    return;
  }

  await excalidrawAPI.updateLibrary({
    libraryItems: (currentItems: LibraryItems) => [
      ...currentItems.filter((item) => !item.id.startsWith(KIT_ID_PREFIX)),
      ...getDrawKitItems(),
    ],
  });

  try {
    localStorage.setItem(KIT_STORAGE_KEY, String(KIT_VERSION));
  } catch {
    // ignore — we'll just try again next load
  }
};
