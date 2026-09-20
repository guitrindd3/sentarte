import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "Cadeiras de praia trançadas à mão";

function weaveRects() {
  const cell = 60;
  const band = 42;
  const cols = Math.ceil(size.width / cell) + 1;
  const rows = Math.ceil(size.height / cell) + 1;
  const rects: ReactNode[] = [];

  for (let c = 0; c < cols; c++) {
    rects.push(
      <div
        key={`v-${c}`}
        style={{
          position: "absolute",
          left: c * cell,
          top: 0,
          width: band,
          height: size.height,
          background: "#0E3E37",
        }}
      />
    );
  }
  for (let r = 0; r < rows; r++) {
    rects.push(
      <div
        key={`h-${r}`}
        style={{
          position: "absolute",
          left: 0,
          top: r * cell,
          width: size.width,
          height: band,
          background: "#15564C",
        }}
      />
    );
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) continue;
      rects.push(
        <div
          key={`x-${r}-${c}`}
          style={{
            position: "absolute",
            left: c * cell,
            top: r * cell,
            width: band,
            height: band,
            background: "#0E3E37",
          }}
        />
      );
    }
  }
  return rects;
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#EDE3D0",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, display: "flex" }}>
          {weaveRects()}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 90px",
            maxWidth: 760,
          }}
        >
          <div
            style={{
              fontFamily: "serif",
              fontSize: 88,
              color: "#241C15",
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              color: "#55493A",
              lineHeight: 1.4,
            }}
          >
            {TAGLINE}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
