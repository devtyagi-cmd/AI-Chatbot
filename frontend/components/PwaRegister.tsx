"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not fatal - the app works fine as a regular website without it,
        // it just won't be installable/offline-shell-cached.
      });
    }
  }, []);

  return null;
}
