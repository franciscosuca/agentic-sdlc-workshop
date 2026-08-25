import {
  createBend,
  supportsHtmlInCanvas,
} from "./canvasui/BendVanilla";

const root = document.getElementById("bend-root") as HTMLDivElement;
const source = document.getElementById("bend-source") as HTMLCanvasElement;
const content = document.getElementById("bend-content") as HTMLDivElement;
const output = document.getElementById("bend-output") as HTMLCanvasElement;

// Mirror the React Bend wrapper: when the html-in-canvas API is available the
// content lives inside the source canvas so Chrome can paint it as a texture;
// otherwise it stays a plain scrollable div (graceful fallback).
if (supportsHtmlInCanvas()) {
  root.classList.add("bend-native");
  source.appendChild(content);
} else {
  document.getElementById("bend-note")?.removeAttribute("hidden");
}

createBend(
  { source, content, output },
  {
    zone: 240,
    angle: 80,
    rounding: 150,
    perspective: 700,
    direction: "in",
    ease: 240,
    smoothing: 0.1,
    tumble: 0.5,
    tilt: 0.5,
  },
);
