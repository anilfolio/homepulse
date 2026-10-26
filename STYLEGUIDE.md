# HomePulse — UI & Design System Styleguide

> **Version:** 2.0  
> **Platform:** HomePulse Healthcare Enterprise Platform  
> **Framework:** Next.js (App Router), TailwindCSS v4, Framer Motion, Lucide Icons  
> **Compliance Standards:** HIPAA & COPPA Compliant UI/UX Architecture

---

## 1. Brand Identity & Logo Standards

The **HomePulse** mark embodies two essential pillars:
1. **Home (The Sanctuary)**: Continuous, compassionate care delivered in the patient's home.
2. **Pulse (The Vital Rhythm)**: Real-time clinical telemetry, active caregiver EVV monitoring, and vital status tracking.

### Official Logo Component: `<HomePulseLogo />`
Located at `src/components/brand/HomePulseLogo.tsx`.

```tsx
import { HomePulseLogo } from "@/components/brand/HomePulseLogo";

// 1. Full Horizontal Wordmark (Navigation, Headers, Login)
<HomePulseLogo
  variant="horizontal"
  size="md"
  showSubtitle={true}
  subtitleText="Healthcare Enterprise Platform"
  theme="dark"
  animated
/>

// 2. Compact Squircle Icon (Sidebar Rails, App Bars)
<HomePulseLogo variant="icon-only" size={36} animated />

// 3. Stacked Monogram (Splash & Modal Banners)
<HomePulseLogo variant="stacked" size="lg" />
```

### Logo Rules & Sizing
- **Minimum Clear Space**: Maintain at least `1x` the icon height in padding on all sides.
- **Minimum Size**:
  - Icon-only: `24px` (display), `16px` (favicon).
  - Horizontal Wordmark: `32px` height.
- **Color Contrast**: Always place on dark backgrounds (`#141D3C`, `#0E152E`) or crisp light surfaces (`#FFFFFF`, `#F4F6FC`) with the appropriate `theme` prop (`dark`, `light`, `white`).
- **Do Not**: Stretch, alter gradient stops, skew, or replace the vital pulse wave with straight lines.

---

## 2. Color Palette & Design Tokens

HomePulse utilizes an enterprise health-tech color palette balancing trustworthy deep navies with energetic clinical periwinkle and life-affirming vital mint.

### Primary Brand Palette
| Token Name | Hex Code | Tailwind / CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Navy Deep Space** | `#141D3C` | `--color-brand-navy`, `bg-[#141D3C]` | Primary dark surface, main sidebar background, high-contrast typography. |
| **Active Navy** | `#1E2B58` | `--color-sidebar-active` | Active sidebar item background, dark telemetry borders. |
| **Electric Periwinkle** | `#6C88FF` | `--color-brand-primary`, `--color-brand-blue` | Primary brand accent, interactive buttons, left logo pillar, active focus rings. |
| **Vital Mint** | `#57EAB6` | `--color-brand-mint`, `text-[#57EAB6]` | Telemetry heartbeat peak, GPS EVV verification, operational status (99.99%). |
| **Page Canvas** | `#F4F6FC` | `--color-page-bg` | Main app background canvas, soft low-glare tone for extended clinical use. |
| **Pure Surface** | `#FFFFFF` | `--color-surface` | Primary card background, elevated modals, data tables. |

### Semantic Health & Alert Tokens
| Status Level | Background | Text Color | Border | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Normal** | `bg-emerald-50` / `rgba(87,234,182,0.15)` | `text-emerald-700` / `#36D49D` | `border-emerald-200` | Verified EVV clock-in, 100% compliance score, vitals in normal range. |
| **Informational** | `bg-blue-50` / `rgba(108,136,255,0.15)` | `text-blue-700` / `#6C88FF` | `border-blue-200` | Upcoming visits, dispatch notifications, training assignments. |
| **Warning / Elevated** | `bg-amber-50` / `rgba(245,158,11,0.15)` | `text-amber-800` / `#F59E0B` | `border-amber-200` | Expiring certifications (30-day window), pending authorisations. |
| **Urgent / Critical** | `bg-red-50` / `rgba(239,68,68,0.15)` | `text-red-700` / `#EF4444` | `border-red-200` | Fall incidents, missed visit alerts, restricted QA reviews. |
| **Neutral / Muted** | `bg-slate-100` | `text-slate-600` | `border-slate-200` | Inactive shifts, draft notes, archived records. |

---

## 3. Typography Scale & Standards

The typography system is built on **Inter** with optimized letter-spacing (`tracking-tight`) for high-density clinical dashboards.

| Style Name | Tailwind Classes | Size / Line-Height | Weight | Common Application |
| :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight` | 36px–48px / 1.15 | 800 | Login hero spotlight, marketing headings. |
| **Page Title** | `text-xl sm:text-2xl font-bold text-slate-900 tracking-tight` | 20px–24px / 1.25 | 700 | Primary top-level view titles (Dashboard, Scheduling, HR). |
| **Section Header** | `text-base sm:text-lg font-semibold text-slate-900` | 16px–18px / 1.35 | 600 | Card titles, group dividers, modal headings. |
| **Card Header / Metric** | `text-2xl sm:text-3xl font-extrabold text-slate-900` | 24px–30px / 1.1 | 800 | Metric numbers, KPI counter values. |
| **Body Primary** | `text-sm font-normal text-slate-700 leading-relaxed` | 14px / 20px | 400 | Table data cells, assessment narratives, instructions. |
| **Body Secondary** | `text-xs font-medium text-slate-500` | 12px / 16px | 500 | Metadata timestamps, table subtitles, field descriptions. |
| **Micro Badge / Label** | `text-[10px] sm:text-[11px] font-bold uppercase tracking-wider` | 10px–11px / 14px | 700 | Category pills, compliance indicators, role badges. |

---

## 4. Better Layout Architectural Patterns

HomePulse uses structured layout systems designed to eliminate clutter, reduce cognitive load, and present mission-critical health telemetry at a glance.

### Pattern A: The 70/30 Command Center Split
Ideal for real-time monitoring where action queues require immediate contextual detail on the right rail.

```
+-----------------------------------------------------------------------------------+
| TopBar: Global Search, Role Badge, Notifications Center, Emergency Action         |
+---------------------------------------------------------+-------------------------+
| Primary Command Surface (70% Width)                     | Context Rail (30% Width)|
|                                                         |                         |
| +-----------------------------------------------------+ | +---------------------+ |
| | KPI Metric Strip (4 Responsive Metric Cards)        | | | Active Telemetry    | |
| +-----------------------------------------------------+ | | Real-time GPS EVV   | |
|                                                         | | Live Visit Status   | |
| +-----------------------------------------------------+ | | Alert Feed          | |
| | Mission-Critical Queue / Data Grid                  | | +---------------------+ |
| | - Patient / Shift / Incident List                   | | | Quick Actions       | |
| | - Multi-filter Pill Toolbar                         | | | - Dispatch Shift    | |
| | - High-density rows with inline statuses            | | | - Log Condition Chg | |
| +-----------------------------------------------------+ | +---------------------+ |
+---------------------------------------------------------+-------------------------+
```

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
  {/* Left Primary Surface (70% / 8 or 9 Columns) */}
  <div className="lg:col-span-8 xl:col-span-8 space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 3 Metric Cards */}
    </div>
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      {/* Main Table or Queue */}
    </div>
  </div>

  {/* Right Context Rail (30% / 4 Columns) */}
  <div className="lg:col-span-4 xl:col-span-4 space-y-5 sticky top-24">
    {/* Live Telemetry / Action Widget */}
  </div>
</div>
```

---

### Pattern B: The Responsive 4-Column KPI Metric Strip
Standardized across all operational dashboards (Intake, Dispatch, HR, Billing, Compliance).

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {metrics.map((m) => (
    <div
      key={m.label}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-4 shadow-[0_6px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-brand-primary/40 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</span>
        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
          <m.icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{m.value}</span>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {m.trend}
        </span>
      </div>
    </div>
  ))}
</div>
```

---

### Pattern C: Master-Detail Split Pane (Patient & Referral Inspection)
Enables caregivers and supervisors to select an item without losing context or leaving the page.

- **Desktop (>=1024px)**: Left column 40% width scrollable list; Right column 60% width sticky inspection panel.
- **Mobile (<1024px)**: Full width list; tapping an item opens a smooth slide-in drawer (`<Modal>` or animated sheet).

---

### Pattern D: Form & Clinical Charting Layout
- **Single-line groupings**: Max 2–3 related fields per row (e.g. First Name, Middle Initial, Last Name).
- **Visual Section Headings**: Clear icon, bold label, and 1-line guidance description.
- **Sticky Bottom Action Bar**: Save, Cancel, Sign & Submit buttons remain anchored to the bottom with `backdrop-blur-md` on long charting forms.

---

## 5. UI Component Library Standards

### 1. Cards & Containers (`src/components/ui/Card.tsx`)
- **Default Card**: `bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)]`
- **Interactive Card**: Add `hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-brand-primary/50 transition-all cursor-pointer`
- **Dark Surface Card**: `bg-gradient-to-br from-[#141D3C] via-[#1A254B] to-[#0E152E] text-white rounded-2xl border border-[#2A3B75]/70`

### 2. Status Badges (`src/components/ui/Badge.tsx`)
```tsx
<Badge variant="success">EVV Verified (GPS)</Badge>
<Badge variant="warning">Recertification Due (7d)</Badge>
<Badge variant="error">Critical Incident</Badge>
<Badge variant="brand">RN Supervised</Badge>
```

### 3. Buttons & Interactive Controls
- **Primary Gradient Button**:
  `bg-gradient-to-r from-[#6C88FF] to-[#5371F3] hover:from-[#5A77FF] hover:to-[#4362E6] text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-[#6C88FF]/25 hover:shadow-lg active:scale-95 transition-all text-sm`
- **Secondary Neutral Button**:
  `bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 active:scale-95 transition-all text-sm`
- **Ghost Action Button**:
  `text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl transition-colors`
- **Destructive Action Button**:
  `bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm`

### 4. Tables & Data Queues
- **Header Row**: `bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3 px-4 border-b border-slate-200`
- **Row Hover**: `hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-b-0`
- **Cell Padding**: `py-3.5 px-4 text-sm text-slate-800`

---

## 6. Elevation, Radius, & Glassmorphism Tokens

### Border Radii Standards
| Class | Pixel Value | Standard Application |
| :--- | :--- | :--- |
| `rounded-lg` | 8px | Form inputs, tooltips, dropdown menu items. |
| `rounded-xl` | 12px | Buttons, badges, avatar containers, small modal cards. |
| `rounded-2xl` | 16px | Primary content cards, split layout containers, dialogs. |
| `rounded-3xl` | 24px | Login container frames, hero banners, command hub decks. |
| `rounded-full` | 9999px | Status indicator dots, toggle pills, circular avatar portraits. |

### Glassmorphism Tokens
```css
/* Light Glass Card */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(16px);
border: 1px solid rgba(226, 230, 243, 0.8);
box-shadow: 0 6px 32px rgba(20, 29, 60, 0.04);

/* Dark Command Glass */
background: rgba(20, 29, 60, 0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(108, 136, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
```

---

## 7. Compliance & Accessibility (HIPAA & COPPA)

1. **Protected Health Information (PHI) Masking**:
   - Patient Medical Record Numbers (MRNs), SSNs, and guardian phone numbers must support click-to-reveal or masked presentation (`•••-••-1294`).
   - Telemetry logs and console messages must never output unencrypted PHI.
2. **Accessible Touch Targets**:
   - For mobile caregiver interfaces (point-of-care, clock-in, vitals charting), interactive touch targets must be at least `44px x 44px`.
3. **Contrast Ratios**:
   - Body copy (`#141D3C` on `#FFFFFF` or `#F4F6FC`) maintains a contrast ratio `>= 8.5:1` (exceeding WCAG 2.1 AAA standard of 7:1).
   - Interactive focus states must use a noticeable `ring-2 ring-brand-primary ring-offset-2` outline.

---

## 8. Live Interactive Styleguide

A live interactive showcase of this design system is available at:
👉 **[http://localhost:3000/styleguide](http://localhost:3000/styleguide)**

Explore and test interactive components, layout previews, color token copy shortcuts, and logo variants in real time.
