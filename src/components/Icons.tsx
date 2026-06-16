// Thin, calm line icons — 1.5px strokes, rounded. Sized 1em, inherit color.
type P = { className?: string };
const base = (className?: string) => ({
  className,
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Photo = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="M3 16l4.5-4 3.5 3 4-4.5L21 16" />
  </svg>
);

export const Quote = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M9.5 7.5C7 8.5 6 10.5 6 13v3.5h4.5V12H8c0-1.6.7-2.7 2.2-3.4zM18 7.5c-2.5 1-3.5 3-3.5 5.5v3.5H19V12h-2.5c0-1.6.7-2.7 2.2-3.4z" />
  </svg>
);

export const Bell = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M18 8.5a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10.3 19.5a2 2 0 003.4 0" />
  </svg>
);

export const Sparkle = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3.5l1.7 4.4 4.4 1.7-4.4 1.7L12 15.7l-1.7-4.4L5.9 9.6l4.4-1.7z" />
    <path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
);

export const Settings = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" />
  </svg>
);

export const Back = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const Drift = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 9c2.5-2 5-2 7 0s4.5 2 7 0M3 14c2.5-2 5-2 7 0s4.5 2 7 0" />
  </svg>
);

export const Expand = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export const Plus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Trash = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

export const Eye = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const EyeOff = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0112 6c6.5 0 10 6 10 6a16 16 0 01-3.3 3.9M6.1 7.1C3.4 8.7 2 12 2 12s3.5 7 10 7a9.4 9.4 0 003.9-.8" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </svg>
);

export const Pencil = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 20l4-1L19 8a2 2 0 00-3-3L5 16l-1 4z" />
  </svg>
);

export const Grip = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);
