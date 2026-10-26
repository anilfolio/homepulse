# HomePulse — Engineering, Compliance & Development Rules

> **Document:** Engineering, Architecture & Compliance Rules (The Rules of the Platform)  
> **Version:** 2.0  
> **Authority:** Mandatory for all Engineers, Product Managers, QA, DevOps, and AI Coding Agents  
> **Companion Documents:** [ARCHITECTURE.md](ARCHITECTURE.md) (System Blueprint) • [STYLEGUIDE.md](STYLEGUIDE.md) (Design System)

---

## 1. Information Architecture (IA) & Navigation Rules

1. **Strict Information Architecture**:
   - Every route and view must belong to a clear, logical hierarchy.
   - **Zero Redundancy**: Do NOT create duplicate views, overlapping screens, or parallel user workflows.
   - **Persona Isolation**:
     - Client/Patient views belong strictly under `/portal` (e.g., `/portal/visits`, `/portal/care-plan`).
     - Field Caregiver views belong strictly under `/caregiver` (e.g., `/caregiver/schedule`, `/caregiver/today`).
     - Referral partners belong strictly under `/partner` (e.g., `/partner/submit`, `/partner/referrals`).
     - Internal agency administration belongs under `/admin`, `/intake`, `/scheduler`, `/clinical`, `/hr`, `/billing`, or `/compliance`.
2. **Context-Preserving Navigation**:
   - Every secondary or tertiary page must provide clear breadcrumb navigation or an explicit back button.
   - Responsive layouts must maintain seamless navigation when collapsing sidebars on mobile or tablet.

---

## 2. Engineering & Code Quality Standards

### TypeScript & Strict Typing
- **No `any`**: The use of `any` is strictly prohibited. All props, state models, database schemas, and API payloads must have explicit TypeScript types or interfaces.
- **Shared Domain Types**: All role and user models must import from `@/types/rbac` or domain-specific type files in `src/types/`.
- **Strict Null Checks**: Always handle `undefined` and `null` safely. Avoid non-null assertions (`!`) unless guaranteed by schema validation.

### Next.js App Router Conventions
- **Server vs. Client Components**:
  - Default to React Server Components (RSC) for initial page layouts and static content.
  - Apply `"use client"` only when components require browser APIs, state hooks (`useState`, `useEffect`), framer-motion animations, or event listeners.
- **Navigation & Routing**:
  - Never manipulate `window.location` directly for internal routes; always use `useRouter()` or Next.js `<Link>`.
- **Form Handling & Validation**:
  - All form submissions must validate inputs against explicit schemas before submission.
  - Inputs must provide real-time accessible error feedback and disabled submit states during network requests.

### Design System & Layout Enforcement
- **Strict Token Adherence**:
  - Only use design tokens defined in [STYLEGUIDE.md](STYLEGUIDE.md) and `globals.css` (e.g., `--color-brand-navy`, `--color-brand-primary`, `--color-brand-mint`).
  - **Zero Magic Numbers/Colors**: Do NOT introduce ad-hoc arbitrary hex values (e.g., `bg-[#283712]`).
- **Standardized Layout Patterns**:
  - High-density monitoring pages must follow the **70/30 Command Split Layout** or **4-Column KPI Metric Grid**.
  - All cards must use the `<Card>` primitive with glassmorphism standard: `bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_6px_32px_rgba(0,0,0,0.04)]`.
  - Brand identity must strictly use `<HomePulseLogo />`.

---

## 3. HIPAA Compliance Rules (Health Insurance Portability & Accountability Act)

HomePulse is an enterprise healthcare platform handling sensitive Protected Health Information (PHI). Non-compliance carries severe civil and criminal penalties under federal law.

### Rule 3.1: Zero PHI in Logs (Absolute Zero Tolerance)
- **Mandate**: Under NO circumstances may PHI (patient names, MRNs, dates of birth, phone numbers, email addresses, or clinical diagnoses) be output to `console.log`, `console.error`, error trackers, or application telemetry.
- **Audit Rule**: Before committing code, verify all logging statements use anonymized identifiers or generic event descriptors (e.g., `Event: VISIT_CLOCK_IN, status: success, timestamp: ISO`).

### Rule 3.2: Encryption at Rest & In Transit
- **At Rest**: All databases, file storage buckets (AWS S3), and cached records must be encrypted using AES-256 (via AWS KMS managed keys).
- **In Transit**: All HTTP traffic must enforce TLS 1.3 (minimum TLS 1.2). Insecure HTTP connections are permanently blocked via HSTS headers.

### Rule 3.3: UI PHI Masking
- **Default Masked Display**: Sensitive fields (SSNs, Medicare/Medicaid IDs, guardian phone numbers) must display as masked characters (`•••-••-1294`) by default.
- **Click-to-Reveal**: Unmasking requires deliberate user action and must be logged in the audit trail.

### Rule 3.4: Role-Based Access & Principle of Least Privilege (PoLP)
- Users are granted only the minimum data access required to perform their duties.
- Field Caregivers can ONLY view patient records for clients explicitly assigned to their scheduled visits.
- Family members can ONLY view records for their authorized loved ones.

### Rule 3.5: Automatic Session Lockouts
- Medical workstation sessions must automatically lock or prompt re-authentication after **15 minutes of inactivity**.

### Rule 3.6: Immutable Audit Logging
- Every action involving PHI (`VIEW`, `CREATE`, `UPDATE`, `EXPORT`, `DELETE`) must write an immutable audit record containing:
  - User ID and active Role.
  - Action performed.
  - Patient ID / Document ID.
  - Timestamp (UTC).
  - Client IP Address and User-Agent.

---

## 4. COPPA Compliance Rules (Children's Online Privacy Protection Act)

When processing records for pediatric patients under 13 years of age:

1. **Verifiable Parental Consent (VPC)**:
   - No personal information may be collected or processed from a pediatric patient without signed, verifiable parental or legal guardian consent recorded in the system.
2. **Pediatric Data Fencing**:
   - Pediatric records must be fenced and strictly segregated from commercial operations.
   - Behavioral tracking, marketing cookies, third-party analytics pixels, and data brokers are strictly banned across all portals.
3. **Parental Right of Access & Expungement**:
   - Parents must have direct self-service access via `/portal` to inspect all collected data and request permanent deletion of their child's records.

---

## 5. Electronic Visit Verification (EVV) & Point-of-Care Rules

To maintain compliance with the 21st Century Cures Act:

1. **GPS Geofence Validation**:
   - Every visit clock-in and clock-out must capture device GPS coordinates and calculate proximity to the client's home address.
   - Visits outside the `< 100-meter` geofence boundary must be flagged with an `EXCEPTION_GEOFENCE` tag requiring supervisor review.
2. **Offline-First Durability**:
   - Mobile caregiver interfaces must cache clock-in events locally with an encrypted HMAC signature if network connectivity drops, syncing automatically upon network restoration.
3. **Audit Trail for Timestamp Corrections**:
   - Caregivers may never directly overwrite visit timestamps. Any manual correction requires reason codes and dual authorization from a Field Supervisor or Billing Coordinator.

---

## 6. Git, Branching & CI/CD Pipeline Rules

1. **Branch Naming Standard**:
   - Features: `feature/<issue-or-feature-name>`
   - Bug Fixes: `fix/<bug-description>`
   - Compliance / Security: `compliance/<rule-reference>`
   - Refactoring / Clean-up: `refactor/<module-name>`
2. **Protected Main Branch**:
   - Direct commits to `main` are strictly forbidden.
   - All changes must pass through a Pull Request with at least one qualified peer review.
3. **Pre-Merge Validation Gates**:
   - `npm run build` or `tsc --noEmit` must complete with zero type errors.
   - Linter (`eslint`) must pass with zero critical errors.
   - Synthetic or mock data only: Never commit real patient records or production credentials.
4. **Environment Isolation**:
   - `Development`, `Staging`, and `Production` environments must be isolated with separate database clusters and API credentials.

---

## 7. Incident Response & Breach Escalation Protocol

1. **Immediate Reporting**: Any suspected unauthorized access, data exposure, credential leak, or compliance breach must be reported to the Security & Compliance Officer within **1 hour** of discovery.
2. **Containment Protocol**:
   - Rotate compromised API tokens / secrets immediately.
   - Isolate affected network pods or session keys.
3. **HHS Breach Notification**: If PHI is compromised, formal notifications to affected clients and the U.S. Department of Health and Human Services (HHS) must adhere to the 60-day statutory window.

---

## 8. Summary Checklist for Code Reviews

Before approving any pull request, reviewers must verify:
- [ ] No PHI printed in `console.log` or error statements.
- [ ] All new components adhere to [STYLEGUIDE.md](STYLEGUIDE.md) tokens and `<HomePulseLogo />`.
- [ ] TypeScript types are explicit with zero `any`.
- [ ] Information Architecture is maintained with zero duplicate routes or fragmented flows.
- [ ] Sensitive inputs include masking where appropriate.
- [ ] New endpoints or actions emit proper audit log events.
