"use client";

import React from "react";
import clsx from "clsx";

export type LogoConcept = "home-pulse" | "h-monogram" | "heart-sanctuary";
export type LogoVariant = "icon-only" | "horizontal" | "stacked";
export type LogoTheme = "dark" | "light" | "white" | "gradient";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

interface HomePulseLogoProps {
  concept?: LogoConcept;
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitleText?: string;
  animated?: boolean;
  className?: string;
}

const SIZE_MAP: Record<"xs" | "sm" | "md" | "lg" | "xl", { icon: number; text: string; sub: string }> = {
  xs: { icon: 24, text: "text-sm", sub: "text-[9px]" },
  sm: { icon: 32, text: "text-base", sub: "text-[10px]" },
  md: { icon: 40, text: "text-xl", sub: "text-[11px]" },
  lg: { icon: 48, text: "text-2xl", sub: "text-xs" },
  xl: { icon: 64, text: "text-3xl", sub: "text-sm" },
};

export function HomePulseLogo({
  concept = "home-pulse",
  variant = "horizontal",
  theme = "dark",
  size = "md",
  showSubtitle = false,
  subtitleText = "Healthcare Enterprise Platform",
  animated = false,
  className,
}: HomePulseLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size].icon;
  const sizeClasses = typeof size === "number" ? { text: "text-xl", sub: "text-xs" } : SIZE_MAP[size];

  // Theme text styling
  const titleColor =
    theme === "white"
      ? "text-white"
      : theme === "light"
      ? "text-[#141D3C]"
      : "text-white";

  const subtitleColor =
    theme === "white"
      ? "text-slate-300"
      : theme === "light"
      ? "text-[#5E6D8A]"
      : "text-[#A8B7DC]";

  const renderIconMark = () => {
    if (concept === "h-monogram") {
      // Concept 1: The Modern H-Monogram with ECG Pulse Waveform
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={clsx("shrink-0 transition-transform duration-300", animated && "group-hover:scale-105")}
        >
          <defs>
            <linearGradient id="hpGradH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C88FF" />
              <stop offset="100%" stopColor="#57EAB6" />
            </linearGradient>
            <filter id="hpShadowH" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <rect width="100" height="100" rx="24" fill="#141D3C" />
          <g filter="url(#hpShadowH)">
            {/* Left Pillar */}
            <rect x="22" y="22" width="13" height="56" rx="6.5" fill="#6C88FF" />
            {/* Right Pillar */}
            <rect x="65" y="22" width="13" height="56" rx="6.5" fill="#57EAB6" />
            {/* Pulse Waveform Crossbar */}
            <path
              d="M 30 50 L 39 50 L 43 42 L 49 64 L 54 36 L 59 52 L 67 50"
              fill="none"
              stroke="url(#hpGradH)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );
    }

    if (concept === "heart-sanctuary") {
      // Concept 2: Care Sanctuary (House outline sheltering a pulsing heart)
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={clsx("shrink-0 transition-transform duration-300", animated && "group-hover:scale-105")}
        >
          <defs>
            <linearGradient id="hpGradHeart" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C88FF" />
              <stop offset="100%" stopColor="#57EAB6" />
            </linearGradient>
            <linearGradient id="hpHeartFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6584" />
              <stop offset="100%" stopColor="#FFB199" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="24" fill="#141D3C" />
          {/* House Roofline */}
          <path
            d="M 22 42 L 50 20 L 78 42"
            fill="none"
            stroke="#6C88FF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Chimney */}
          <path d="M 68 25 V 34" stroke="#6C88FF" strokeWidth="4.5" strokeLinecap="round" />
          {/* Stylized Heart with Pulse */}
          <path
            d="M 50 78 C 30 65 24 50 32 38 C 39 28 50 36 50 42 C 50 36 61 28 68 38 C 76 50 70 65 50 78 Z"
            fill="url(#hpHeartFill)"
            opacity="0.9"
          />
          {/* Pulse Line across Heart */}
          <path
            d="M 33 52 L 42 52 L 46 44 L 51 60 L 56 38 L 60 52 L 67 52"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // Default / Concept 1: The Integrated Home & Pulse Line (Primary Signature Mark)
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx("shrink-0 transition-transform duration-300", animated && "group-hover:scale-105")}
      >
        <defs>
          <linearGradient id="hpBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#141D3C" />
            <stop offset="100%" stopColor="#0E152E" />
          </linearGradient>
          <linearGradient id="hpStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C88FF" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#57EAB6" />
          </linearGradient>
          <linearGradient id="hpPulseGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6C88FF" />
            <stop offset="100%" stopColor="#57EAB6" />
          </linearGradient>
          <filter id="hpSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Badge Background */}
        <rect width="100" height="100" rx="24" fill="url(#hpBadgeBg)" stroke="#2A3B75" strokeWidth="1.5" />

        {/* Roof Structure */}
        <path
          d="M 22 45 L 50 22 L 78 45"
          fill="none"
          stroke="#6C88FF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Roof Chimney Detail */}
        <path d="M 68 28 V 37" stroke="#6C88FF" strokeWidth="4.5" strokeLinecap="round" />

        {/* Home Base Left Pillar */}
        <path d="M 27 45 V 72" stroke="#6C88FF" strokeWidth="6" strokeLinecap="round" />

        {/* Home Base Right Pillar */}
        <path d="M 73 45 V 72" stroke="#57EAB6" strokeWidth="6" strokeLinecap="round" />

        {/* Dynamic Heartbeat / Pulse Waveform bridging the home foundation */}
        <path
          d="M 18 64 L 32 64 L 38 52 L 46 76 L 55 38 L 63 68 L 68 64 L 82 64"
          fill="none"
          stroke="url(#hpPulseGlow)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulse Heartbeat Node / Glow dot at peak */}
        <circle cx="55" cy="38" r="3.5" fill="#57EAB6" />
      </svg>
    );
  };

  if (variant === "icon-only") {
    return <div className={clsx("inline-flex items-center group", className)}>{renderIconMark()}</div>;
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center group select-none",
        variant === "stacked" ? "flex-col text-center gap-2" : "gap-3",
        className
      )}
    >
      {renderIconMark()}

      <div className={clsx("flex flex-col", variant === "stacked" && "items-center")}>
        <div className="flex items-center tracking-tight leading-none">
          <span className={clsx("font-extrabold tracking-tight", sizeClasses.text, titleColor)}>
            Home
          </span>
          <span
            className={clsx(
              "font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6C88FF] to-[#57EAB6]",
              sizeClasses.text
            )}
          >
            Pulse
          </span>
        </div>

        {showSubtitle && (
          <span className={clsx("font-medium tracking-wide mt-1 block uppercase", sizeClasses.sub, subtitleColor)}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
}
