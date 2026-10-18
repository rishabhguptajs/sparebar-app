import { ImageResponse } from "next/og";

export const alt =
  "Sparebar: AI UGC images and videos with one consistent character";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0c0c12",
        color: "#fff",
        padding: 72,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: -1,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: "#ff4f93",
            borderRadius: 8,
            transform: "rotate(45deg)",
          }}
        />
        Sparebar
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: -3,
            maxWidth: 980,
          }}
        >
          Make UGC with a character you own.
        </div>
        <div style={{ fontSize: 32, color: "#a8a8b8" }}>
          AI image and video generator. Same face, every shot.
        </div>
      </div>
      <div style={{ fontSize: 28, color: "#ff4f93" }}>sparebar.xyz</div>
    </div>,
    size,
  );
}
