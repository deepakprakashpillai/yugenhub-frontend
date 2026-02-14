// src/theme.js

const SHARED_ACCENTS = {
  knots: {
    primary: "#fb7185",
    glow: "rgba(251, 113, 133, 0.15)",
  },
  pluto: {
    primary: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.15)",
  },
  festia: {
    primary: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.15)",
  },
  thryv: {
    primary: "#4ade80",
    glow: "rgba(74, 222, 128, 0.15)",
  },
  tasks: {
    primary: "#a855f7",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  finance: {
    primary: "#22c55e",
    glow: "rgba(34, 197, 94, 0.15)",
  },
  default: {
    primary: "#ef4444",
    glow: "rgba(239, 68, 68, 0.15)",
  }
};

const SHARED_TEXT = {
  heading: "font-black tracking-tighter italic uppercase",
  nav: "text-[11px] font-black tracking-widest uppercase",
  label: "text-[9px] font-black uppercase tracking-[0.3em]",
};

const PASTEL_ACCENTS = {
  knots: {
    primary: "#fda4af",
    glow: "rgba(253, 164, 175, 0.4)",
  },
  pluto: {
    primary: "#93c5fd",
    glow: "rgba(147, 197, 253, 0.4)",
  },
  festia: {
    primary: "#fcd34d",
    glow: "rgba(252, 211, 77, 0.4)",
  },
  thryv: {
    primary: "#86efac",
    glow: "rgba(134, 239, 172, 0.4)",
  },
  tasks: {
    primary: "#d8b4fe",
    glow: "rgba(216, 180, 254, 0.4)",
  },
  finance: {
    primary: "#6ee7b7",
    glow: "rgba(110, 231, 183, 0.4)",
  },
  default: {
    primary: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.4)",
  }
};

export const THEME_VARIANTS = {
  dark: {
    mode: 'dark',
    canvas: {
      bg: "bg-black",
      sidebar: "bg-black",
      card: "bg-zinc-950",
      border: "border-zinc-900",
      hover: "hover:bg-zinc-900/50",
      active: "bg-white text-black",
      inactive: "text-zinc-500",
    },
    text: {
      ...SHARED_TEXT,
      primary: "text-white",
      secondary: "text-zinc-400",
      label: "text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]",
    },
    accents: SHARED_ACCENTS,
  },
  light: {
    mode: 'light',
    canvas: {
      bg: "bg-[#fdf4ff]",        // Fuchsia-50 (Soft Pink/Purple)
      sidebar: "bg-[#fff1f2]",   // Rose-50
      card: "bg-white/90 backdrop-blur-sm border border-[#e9d5ff] shadow-sm", // Glassy with Purple-200 border
      border: "border-[#e9d5ff]", // Purple-200
      hover: "hover:bg-[#fae8ff]", // Fuchsia-100
      active: "bg-[#a78bfa] text-white", // Violet-400
      inactive: "text-[#94a3b8]", // Slate-400
    },
    text: {
      ...SHARED_TEXT,
      primary: "text-[#334155]", // Slate-700
      secondary: "text-[#64748b]", // Slate-500
      label: "text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.3em]",
    },
    accents: PASTEL_ACCENTS,
  }
};

// Fallback for older imports - defaults to Dark
export const THEME_CONFIG = THEME_VARIANTS.dark;