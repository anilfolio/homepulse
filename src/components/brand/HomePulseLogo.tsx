"use client";

import React, { useId } from "react";
import clsx from "clsx";

export type LogoConcept = "home-pulse" | "app-icon" | "h-monogram" | "heart-sanctuary";
export type LogoVariant = "icon-only" | "horizontal" | "stacked";
export type LogoTheme = "dark" | "light" | "white" | "monochrome" | "monochrome-dark" | "gradient";
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

/**
 * Authentic HomePulse HD Logo Component
 * Recreated with exact vector fidelity matching the official brand identity.
 */
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
  const uniqueId = useId().replace(/:/g, "_");
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size].icon;
  const sizeClasses = typeof size === "number" ? { text: "text-xl", sub: "text-xs" } : SIZE_MAP[size];

  // Theme text styling
  const isDark = theme === "dark" || theme === "monochrome-dark";
  const isWhite = theme === "white";

  const homeColor = isWhite
    ? "text-white"
    : isDark
    ? "text-[#7DD3FC]"
    : theme === "monochrome"
    ? "text-[#0066B3]"
    : "text-[#0066B3]";

  const pulseColor = isWhite
    ? "text-white"
    : isDark
    ? "text-[#34D399]"
    : theme === "monochrome"
    ? "text-[#0066B3]"
    : "text-[#00A887]";

  const subtitleColor = isWhite
    ? "text-slate-200"
    : isDark
    ? "text-[#94A3B8]"
    : theme === "monochrome"
    ? "text-[#0066B3]/80"
    : "text-[#0D7A75]";

  const renderIconMark = () => {
    const brandGradId = `hpBrand_${uniqueId}`;
    const darkGradId = `hpDark_${uniqueId}`;
    const squircleGradId = `hpSq_${uniqueId}`;

    // Color definitions based on theme
    const strokeGrad =
      theme === "white"
        ? "#FFFFFF"
        : theme === "monochrome"
        ? "#0066B3"
        : theme === "monochrome-dark"
        ? "#FFFFFF"
        : isDark
        ? `url(#${darkGradId})`
        : `url(#${brandGradId})`;

    const fillGrad = strokeGrad;

    // 1. App Icon / Squircle variant (matches 16x16 - 128x128 brand tiles)
    if (concept === "app-icon") {
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={clsx("shrink-0 transition-transform duration-300", animated && "group-hover:scale-105")}
        >
          <defs>
            <linearGradient id={squircleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00A887" />
              <stop offset="40%" stopColor="#008EA0" />
              <stop offset="75%" stopColor="#0072B5" />
              <stop offset="100%" stopColor="#005A9C" />
            </linearGradient>
          </defs>
          <rect width="1000" height="1000" rx="220" fill={`url(#${squircleGradId})`} />
          <g transform="translate(140, 140) scale(0.72)">
            {/* Shield */}
            <path
              d="M 500 146 C 388 156 268 196 204 250 C 190 280 190 330 196 380 C 202 440 206 500 214 560 C 232 652 338 775 500 872 C 662 775 768 652 786 560 C 794 500 798 440 804 380 C 810 330 810 280 796 250 C 732 196 612 156 500 146 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="36"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Chimney */}
            <polygon points="316,285 379,285 379,350 316,396" fill="#FFFFFF" />
            {/* Roof */}
            <polyline
              points="185,496 500,240 805,484"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
            />
            {/* Eaves & Walls */}
            <line x1="167" y1="507" x2="318" y2="507" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round" />
            <line x1="300" y1="507" x2="300" y2="624" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="square" />
            <line x1="823" y1="493" x2="688" y2="493" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="round" />
            <line x1="706" y1="493" x2="706" y2="540" stroke="#FFFFFF" strokeWidth="36" strokeLinecap="square" />
            {/* Radar Signal Rings */}
            <circle cx="646" cy="356" r="44" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="646" cy="356" r="70" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="646" cy="356" r="96" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="646" cy="356" r="22" fill="#FFFFFF" />
            {/* Telemetry */}
            <g stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
              <line x1="424" y1="419" x2="484" y2="355" />
              <line x1="484" y1="355" x2="574" y2="454" />
              <line x1="574" y1="454" x2="614" y2="466" />
              <line x1="574" y1="454" x2="646" y2="356" />
              <line x1="646" y1="356" x2="718" y2="298" />
            </g>
            <circle cx="424" cy="419" r="16" fill="#FFFFFF" />
            <circle cx="484" cy="355" r="18" fill="#FFFFFF" />
            <circle cx="574" cy="454" r="18" fill="#FFFFFF" />
            <circle cx="614" cy="466" r="11" fill="#FFFFFF" />
            <circle cx="718" cy="298" r="15" fill="#FFFFFF" />
            {/* Pulse */}
            <path
              d="M 156 655 L 338 655 C 355 655 368 668 376 680 L 406 542 L 440 690 L 480 405 L 540 742 L 576 570 C 582 568 588 568 596 568 L 740 568 C 748 568 756 564 762 558 L 865 480"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="36"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
            {/* Arrowhead */}
            <polygon points="936,432 864,432 876,480 919,520" fill="#FFFFFF" />
          </g>
        </svg>
      );
    }

    // 2. Primary HD Vector Shield & Pulse Emblem
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx("shrink-0 transition-transform duration-300", animated && "group-hover:scale-105")}
      >
        <defs>
          <linearGradient id={brandGradId} x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#0066B3" />
            <stop offset="25%" stopColor="#007BC7" />
            <stop offset="50%" stopColor="#0096AD" />
            <stop offset="75%" stopColor="#00A78E" />
            <stop offset="100%" stopColor="#00B388" />
          </linearGradient>

          <linearGradient id={darkGradId} x1="0%" y1="30%" x2="100%" y2="70%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#22D3EE" />
            <stop offset="70%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>

        {/* 1. Shield Frame */}
        <path
          d="M 500 146 C 388 156 268 196 204 250 C 190 280 190 330 196 380 C 202 440 206 500 214 560 C 232 652 338 775 500 872 C 662 775 768 652 786 560 C 794 500 798 440 804 380 C 810 330 810 280 796 250 C 732 196 612 156 500 146 Z"
          fill="none"
          stroke={strokeGrad}
          strokeWidth="36"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 2. House Chimney */}
        <polygon points="316,285 379,285 379,350 316,396" fill={fillGrad} />

        {/* 3. House Roof */}
        <polyline
          points="185,496 500,240 805,484"
          fill="none"
          stroke={strokeGrad}
          strokeWidth="38"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
        />

        {/* House Eaves & Walls */}
        <line x1="167" y1="507" x2="318" y2="507" stroke={strokeGrad} strokeWidth="36" strokeLinecap="round" />
        <line x1="300" y1="507" x2="300" y2="624" stroke={strokeGrad} strokeWidth="36" strokeLinecap="square" />

        <line x1="823" y1="493" x2="688" y2="493" stroke={strokeGrad} strokeWidth="36" strokeLinecap="round" />
        <line x1="706" y1="493" x2="706" y2="540" stroke={strokeGrad} strokeWidth="36" strokeLinecap="square" />

        {/* 4. Radar Concentric Signal Rings */}
        <g fill="none" stroke={strokeGrad} strokeWidth="10" strokeLinecap="round">
          <circle cx="646" cy="356" r="44" />
          <circle cx="646" cy="356" r="70" />
          <circle cx="646" cy="356" r="96" />
        </g>
        <circle cx="646" cy="356" r="22" fill={fillGrad} />

        {/* 5. Telemetry Graph */}
        <g stroke={strokeGrad} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
          <line x1="424" y1="419" x2="484" y2="355" />
          <line x1="484" y1="355" x2="574" y2="454" />
          <line x1="574" y1="454" x2="614" y2="466" />
          <line x1="574" y1="454" x2="646" y2="356" />
          <line x1="646" y1="356" x2="718" y2="298" />
        </g>
        <g fill={fillGrad}>
          <circle cx="424" cy="419" r="16" />
          <circle cx="484" cy="355" r="18" />
          <circle cx="574" cy="454" r="18" />
          <circle cx="614" cy="466" r="11" />
          <circle cx="718" cy="298" r="15" />
        </g>

        {/* 6. ECG Vital Pulse Waveform */}
        <path
          d="M 156 655 L 338 655 C 355 655 368 668 376 680 L 406 542 L 440 690 L 480 405 L 540 742 L 576 570 C 582 568 588 568 596 568 L 740 568 C 748 568 756 564 762 558 L 865 480"
          fill="none"
          stroke={strokeGrad}
          strokeWidth="36"
          strokeLinecap="square"
          strokeLinejoin="round"
        />

        {/* 7. Growth Telemetry Arrowhead */}
        <polygon points="936,432 864,432 876,480 919,520" fill={fillGrad} />
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
          <span className={clsx("font-extrabold tracking-tight", sizeClasses.text, homeColor)}>
            Home
          </span>
          <span className={clsx("font-extrabold tracking-tight", sizeClasses.text, pulseColor)}>
            Pulse
          </span>
        </div>

        {showSubtitle && (
          <span
            className={clsx(
              "font-semibold tracking-normal mt-1 block",
              sizeClasses.sub,
              subtitleColor
            )}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
}
