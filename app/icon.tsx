import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#15564C",
        }}
      >
        <span
          style={{
            fontFamily: "serif",
            fontSize: 22,
            color: "#EDE3D0",
            lineHeight: 1,
            transform: "translateY(1px)",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
