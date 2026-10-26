# HomePulse — Agent & Developer Guidelines

## 1. Core Rule Compliance
Before proposing, writing, or refactoring any code in this repository, you MUST strictly adhere to the following core guidelines:
- **Architecture Blueprint**: Refer to [ARCHITECTURE.md](../ARCHITECTURE.md) for domain subsystems, route topography, and RBAC matrix.
- **Design System & Layouts**: Refer to [STYLEGUIDE.md](../STYLEGUIDE.md) for brand tokens, typography scale, `<HomePulseLogo />`, and layout patterns (70/30 Command Split, 4-col KPI grid).
- **Engineering & Compliance Rules**: Refer to [RULES.md](../RULES.md) for HIPAA/COPPA rules, zero PHI logging policy, TypeScript standards, and CI/CD gates.

## 2. Information Architecture (IA) Mandate
- Ensure all new changes follow a clear and well-structured Information Architecture (IA).
- Every page should be logically connected with a consistent user workflow, maintaining seamless navigation across the entire platform.
- **Zero Redundancy**: Avoid duplicate pages, redundant user flows, or overlapping functionality to ensure a cohesive and intuitive user experience.
