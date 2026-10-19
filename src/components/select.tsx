"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown when the value matches no option. */
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

const field = "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm";

/** A dropdown drawn by us, so it looks the same on every system. Keyboard: arrows, Enter, Escape, type to jump. */
export function Select({ id, value, onChange, options, placeholder = "Choose", ariaLabel, className }: Props) {
  const auto = useId();
  const listId = `${id ?? auto}-list`;
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [active, setActive] = useState(0);

  const selected = options.findIndex((o) => o.value === value);
  const current = selected >= 0 ? options[selected] : null;

  function show() {
    const r = root.current?.getBoundingClientRect();
    setUp(!!r && window.innerHeight - r.bottom < 280 && r.top > window.innerHeight - r.bottom);
    setActive(selected >= 0 ? selected : Math.max(0, options.findIndex((o) => !o.disabled)));
    setOpen(true);
  }

  function pick(i: number) {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  }

  function step(from: number, dir: 1 | -1) {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
    return from;
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") return setOpen(false);
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation(); // keep a surrounding dialog open
        setOpen(false);
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return show();
      return setActive((a) => step(a, e.key === "ArrowDown" ? 1 : -1));
    }
    if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      return setActive(e.key === "Home" ? step(-1, 1) : step(options.length, -1));
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      return open ? pick(active) : show();
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) {
        if (!open) show();
        setActive(i);
      }
    }
  }

  return (
    <div ref={root} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`${field} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${current ? "" : "text-ink-2"}`}>{current?.label ?? placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 text-ink-2 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 z-50 max-h-64 w-full overflow-auto rounded-xl border border-line bg-panel p-1 shadow-xl ${up ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${o.disabled ? "cursor-not-allowed opacity-40" : ""} ${i === active ? "bg-panel-2" : ""} ${o.value === value ? "font-medium text-ink" : "text-ink-2"}`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-accent">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
