type P = React.SVGProps<SVGSVGElement>;

const base = (p: P): P => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...p,
});

export const StudioIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.5 4l1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8L4 10.5l4.8-1.7z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </svg>
);

export const PeopleIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" />
  </svg>
);

export const RerunIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg {...base({ fill: "currentColor", stroke: "none", ...p })}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const ImageIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M4.5 17l4.5-4.5 3.5 3.5 2.5-2.5 4.5 4" />
  </svg>
);

export const VideoIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="6" width="12" height="12" rx="2" />
    <path d="M15.5 10.5L20.5 8v8l-5-2.5" />
  </svg>
);

export const SignOutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14M10 12h10M17 8.5l3.5 3.5-3.5 3.5" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 16V5M7.5 9L12 4.5 16.5 9M5 20h14" />
  </svg>
);

export const CoinIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M14.5 9.5c-.4-.9-1.3-1.4-2.5-1.4-1.5 0-2.5.8-2.5 1.9 0 2.7 5.2 1.2 5.2 3.9 0 1.1-1.1 1.9-2.7 1.9-1.3 0-2.3-.6-2.7-1.6M12 6.8v1.3M12 15.9v1.3" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5l7 2.5v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
);

export const SettingsIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
  </svg>
);

export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z" />
  </svg>
);

export const WandIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 19L15.5 8.5" />
    <path d="M14 7l3 3" />
    <path d="M17.5 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6zM6.5 5l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" />
  </svg>
);

export const MoreIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="12" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="18.5" cy="12" r="1.3" />
  </svg>
);
