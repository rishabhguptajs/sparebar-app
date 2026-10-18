// One flat badge per maker: a solid colour with a plain geometric mark. Models from the same maker
// share it, so a list scans by family at a glance. These are our own shapes, not the makers' logos.

const MAKERS: Record<string, { color: string; mark: React.ReactNode }> = {
  Google: {
    color: "#3b6ef5",
    mark: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <circle cx="8" cy="16" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
  },
  ByteDance: {
    color: "#12b5a5",
    mark: (
      <>
        <rect x="5" y="5" width="9" height="5" rx="1.5" />
        <rect x="10" y="14" width="9" height="5" rx="1.5" />
      </>
    ),
  },
  Kling: { color: "#f0782e", mark: <path d="M8 5.5v13l11-6.5z" /> },
  Alibaba: {
    color: "#7a5af5",
    mark: (
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    ),
  },
  xAI: {
    color: "#171821",
    mark: (
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  MiniMax: {
    color: "#e8477c",
    mark: (
      <path
        d="M4 14c3-8 5-8 8 0s5 8 8 0"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  Runway: { color: "#8fa11d", mark: <path d="M5 16a7 7 0 0114 0z" /> },
  "Black Forest Labs": {
    color: "#0e8a5f",
    mark: (
      <>
        <path d="M12 4l5 7H7z" />
        <path d="M12 11l6 8H6z" />
      </>
    ),
  },
  HeyGen: {
    color: "#c94fd6",
    mark: (
      <>
        <circle cx="12" cy="9" r="3.2" />
        <path d="M6 19a6 6 0 0112 0z" />
      </>
    ),
  },
  Recraft: { color: "#e0a020", mark: <path d="M12 4l8 8-8 8-8-8z" /> },
  Sourceful: { color: "#4a5568", mark: <path d="M12 4l7 4v8l-7 4-7-4V8z" /> },
};

export function MakerMark({
  maker,
  className = "size-10",
}: {
  maker: string;
  className?: string;
}) {
  const m = MAKERS[maker] ?? {
    color: "#6b7280",
    mark: <circle cx="12" cy="12" r="5" />,
  };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl text-white dark:brightness-90 ${className}`}
      style={{ background: m.color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="currentColor">
        {m.mark}
      </svg>
    </span>
  );
}
