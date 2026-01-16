# Device Prophet Labs: Project Roadmap

**Status:** Living Document
**Context:** Remaining features and ideas to reach "v2.0" vision.

## 1. Visual & UX Polish (High Priority)

### Desktop "Design View"

- **Goal:** Replace the static list view with an interactive node-based graph.
- **Tech:** `react-flow-renderer`.
- **Design:** Nodes (CPU, Power, Connectivity) should physically shake/redden when their specific tags (e.g., `[thermal_issues]`) are active.

### Mobile "Rack View"

- **Goal:** A vertical "System Stack" for mobile.
- **Design:** CSS-based server rack bars that "crack" (using `clip-path`) or spark when damage occurs.

### Visual "Juice" & Feedback

- **Damage:** Screen shake (via `framer-motion`) when Doom increases > 20%.
- **Hacking:** Glitch text effects (CSS keyframes) for "Network" nodes when `[root_shell]` is active.
- **Boot Sequence:** CRT-style "turn on" effect on the Splash screen.

## 2. Gameplay Expansion & Modes

### Extended Play

- **Standard (120 months):** 10-year support commitment.
- **Extreme (240 months):** EU CRA "Lifetime" mode.
- **Late-Game Events:**
    - Silicon Respin (Month 80+)
    - Post-Quantum Crypto Mandate (Month 120+)
    - "Zombie Device" Class Action (Month 150+)

## 3. Infrastructure

### Analytics

- **Goal:** Privacy-friendly win-rate tracking (e.g., Plausible).
- **Metrics:** "Most Lethal Event", "Average Lifespan".
