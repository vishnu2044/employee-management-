"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-background)] transition-opacity duration-500">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 flex items-center justify-center shrink-0">
          <img src="/logo.jpg" alt="Piekarnia Putka Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] uppercase">
            Piekarnia Putka
          </h1>
          <p className="text-[var(--color-primary)] font-semibold tracking-widest text-sm uppercase">
            Attendance
          </p>
        </div>
      </div>
    </div>
  );
}
