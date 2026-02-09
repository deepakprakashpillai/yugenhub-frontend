// src/theme.js

export const THEME_CONFIG = {
  // Global App Colors
  canvas: {
    bg: "bg-black",
    sidebar: "bg-black",
    card: "bg-zinc-950",
    border: "border-zinc-900",
  },

  // Typography Settings
  text: {
    heading: "font-black tracking-tighter italic uppercase",
    nav: "text-[11px] font-black tracking-widest uppercase",
    label: "text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]",
  },

  // Vertical-Specific Accents
  accents: {
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
  } // This closes 'accents'
}; // This closes 'THEME_CONFIG'