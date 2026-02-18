"use client";

import { useState, useEffect } from "react";

export default function AccessibilityToolbar() {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 bg-white text-black p-2 rounded shadow-lg z-50">
      <button
        onClick={() => setFontSize(fontSize + 2)}
        aria-label="Increase text size"
        className="px-2 py-1 border rounded"
      >
        A+
      </button>
      <button
        onClick={() => setFontSize(fontSize - 2)}
        aria-label="Decrease text size"
        className="px-2 py-1 border rounded"
      >
        A-
      </button>
      <button
        onClick={() => alert("Screen reader help activated")}
        aria-label="Screen reader help"
        className="px-2 py-1 border rounded"
      >
        🧏‍♂️
      </button>
    </div>
  );
}
