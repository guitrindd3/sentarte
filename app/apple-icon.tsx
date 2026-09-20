import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            fontSize: 108,
            color: "#EDE3D0",
            lineHeight: 1,
            transform: "translateY(6px)",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
