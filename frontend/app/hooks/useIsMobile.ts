"use client";
import { useState, useEffect } from "react";

export function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}
