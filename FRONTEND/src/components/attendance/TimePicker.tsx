"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Clock, X } from "lucide-react";

interface WheelColumnProps {
  items: number[];
  selected: number;
  onSelect: (value: number) => void;
  itemHeight?: number;
}

function WheelColumn({ items, selected, onSelect, itemHeight = 40 }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = items.indexOf(selected);
    return idx >= 0 ? idx : 0;
  });

  const isUserInteractingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const pointerStartScrollTopRef = useRef<number>(0);

  // Sync scroll position when `selected` changes or on mount
  useEffect(() => {
    if (isUserInteractingRef.current) return;
    const idx = items.indexOf(selected);
    const targetIdx = idx >= 0 ? idx : 0;
    setActiveIndex(targetIdx);

    if (containerRef.current) {
      const targetScroll = targetIdx * itemHeight;
      if (Math.abs(containerRef.current.scrollTop - targetScroll) > 1) {
        containerRef.current.scrollTop = targetScroll;
      }
    }
  }, [selected, items, itemHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const idx = Math.round(scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIndex(clamped);

    isUserInteractingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      onSelect(items[clamped]);
    }, 80);
  };

  const handleItemClick = (idx: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * itemHeight,
        behavior: "smooth",
      });
    }
    setActiveIndex(idx);
    onSelect(items[idx]);
  };

  // Mouse drag support for desktop browsers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return; // Touch devices use native momentum scrolling
    isUserInteractingRef.current = true;
    pointerStartYRef.current = e.clientY;
    pointerStartScrollTopRef.current = containerRef.current?.scrollTop || 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartYRef.current === null || !containerRef.current) return;
    const deltaY = e.clientY - pointerStartYRef.current;
    containerRef.current.scrollTop = pointerStartScrollTopRef.current - deltaY;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartYRef.current === null) return;
    pointerStartYRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (containerRef.current) {
      const nearest = Math.round(containerRef.current.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, nearest));
      containerRef.current.scrollTo({
        top: clamped * itemHeight,
        behavior: "smooth",
      });
      setActiveIndex(clamped);
      onSelect(items[clamped]);
    }

    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="flex-1 overflow-y-auto select-none touch-pan-y cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      style={{
        height: `${itemHeight * 5}px`,
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Top spacer so row 0 aligns with the center highlight (row 3) */}
      <div style={{ height: `${itemHeight * 2}px` }} />

      {items.map((item, idx) => {
        const dist = Math.abs(idx - activeIndex);
        let textStyle = "text-sm text-gray-300 font-normal";
        if (dist === 0) {
          textStyle = "text-xl font-bold text-gray-900";
        } else if (dist === 1) {
          textStyle = "text-base font-medium text-gray-400";
        }

        return (
          <div
            key={item}
            onClick={() => handleItemClick(idx)}
            className={`flex items-center justify-center font-mono cursor-pointer transition-all duration-75 ${textStyle}`}
            style={{
              height: `${itemHeight}px`,
              scrollSnapAlign: "center",
            }}
          >
            {item.toString().padStart(2, "0")}
          </div>
        );
      })}

      {/* Bottom spacer so the last row aligns with the center highlight */}
      <div style={{ height: `${itemHeight * 2}px` }} />
    </div>
  );
}

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parseTime = useCallback((val: string) => {
    if (!val || !val.includes(":")) return { h: 8, m: 30 };
    const [hStr, mStr] = val.split(":");
    return {
      h: parseInt(hStr, 10) || 0,
      m: parseInt(mStr, 10) || 0,
    };
  }, []);

  const [tempH, setTempH] = useState(8);
  const [tempM, setTempM] = useState(30);

  // Sync draft state on open or when value changes
  useEffect(() => {
    const p = parseTime(value);
    setTempH(p.h);
    setTempM(p.m);
  }, [value, isOpen, parseTime]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    const formatted = `${tempH.toString().padStart(2, "0")}:${tempM.toString().padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleCancel = () => {
    const p = parseTime(value);
    setTempH(p.h);
    setTempM(p.m);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
          {label}
        </label>
      )}

      {/* Input trigger box matching the design */}
      <div
        className="flex items-center justify-between border border-[var(--color-border)] rounded bg-white overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-colors px-3 py-2.5 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-mono text-base font-semibold text-gray-800 tracking-wider">
          {value || "00:00"}
        </span>
        <Clock size={18} className="text-gray-400" />
      </div>

      {/* Dropdown Wheel Picker */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[210px] bg-white border border-gray-200 shadow-2xl rounded-lg z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header bar: [✕ LABEL] on left, [SAVE] in red on right */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-1.5 text-gray-700 hover:text-black transition"
            >
              <X size={15} className="text-gray-500" />
              <span className="font-bold text-[11px] uppercase tracking-wider">
                {label || "TIME"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-[#8B0000] hover:text-red-800 text-xs font-bold uppercase tracking-wider px-2 py-1 transition"
            >
              SAVE
            </button>
          </div>

          {/* Wheel Selection Area */}
          <div className="relative flex flex-row items-center justify-center bg-white py-1">
            {/* Center Selection Highlight Bar with top and bottom borders */}
            <div
              className="absolute left-0 right-0 pointer-events-none border-y border-gray-200 bg-gray-50/50"
              style={{
                top: "84px", // 40px * 2 + 4px (py-1 offset)
                height: "40px",
              }}
            />

            {/* Hours Column */}
            <WheelColumn
              items={hours}
              selected={tempH}
              onSelect={setTempH}
              itemHeight={40}
            />

            {/* Colon Separator */}
            <div className="flex items-center justify-center font-bold text-xl text-gray-800 px-1 z-10 select-none pb-0.5">
              :
            </div>

            {/* Minutes Column */}
            <WheelColumn
              items={minutes}
              selected={tempM}
              onSelect={setTempM}
              itemHeight={40}
            />
          </div>
        </div>
      )}
    </div>
  );
}
