"use client";
import React from "react";

// Glassmorphism backdrop layer: large, heavily-blurred soft shapes float deep
// behind the content. A crisp card on top reads as layered 3D depth. Purely
// decorative.
export default function EduBackground() {
  return (
    <div className="tz-shapes" aria-hidden="true">
      <div className="tz-shape s1" />
      <div className="tz-shape s2" />
      <div className="tz-shape s3" />
    </div>
  );
}
