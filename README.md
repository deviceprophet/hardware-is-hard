# The Recall Run: The IoT Doom Simulator

> 📉 **The Doom Simulator for IoT.** Can you survive 5 years of hacks, EU regulations, and budget cuts? A "Hardware is Hard" simulation game built with React.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Compliance Level](https://img.shields.io/badge/compliance-questionable-orange)

**Play the live simulation here:** [www.deviceprophet.com/labs](https://www.deviceprophet.com/labs)

---

## 🧐 What is this?

**The Recall Run** is a browser-based survival horror game for Embedded Engineers and Product Managers.

Instead of fighting zombies, you fight the real monsters: **Supply Chain Shortages**, **The EU Cyber Resilience Act**, and **Marketing teams demanding AI features on an 8-bit MCU.**

The goal: Launch a device and keep it alive for 5 years without getting banned, hacked, or bankrupted.

## 🕹️ The Tech Stack

This project is a client-side simulation engine ("Game Island") embedded in an Astro site.

- **Host:** Astro (Cloudflare Workers)
- **Core:** React 18 + Tailwind CSS
- **State:** Zustand (Transient updates for high-performance timeline)
- **Logic:** A custom tag-based "Deck Building" engine that punishes your architectural decisions.

## 🛠️ How it Works

The simulation uses **Architectural Consequences** rather than random chance:

1.  **Select Device:** You pick an archetype (e.g., "Smart Lock", "Industrial Sensor") which sets your starting risks.
2.  **Make Choices:** During development, you face trade-offs (e.g., "Use Cheap Wi-Fi to save budget?").
3.  **Accumulate Tags:** Bad choices add tags like `[vulnerable_wifi]`.
4.  **Trigger Events:** The event deck scans your tags. `[vulnerable_wifi]` guarantees the "Botnet Recruitment" disaster will happen.

> **💰 Note on Budget:** The "Budget" tracked in-game is your **Engineering & Development Budget**, not company revenue. You are expected to burn cash to survive. Ending with a negative budget is normal (and often required to ship a robust product). Your goal is survival, not profit.

## 🤝 Contributing

We crowdsource the disasters. Did you live through a specific hardware horror story? Add it to the game!

### We Need Your Horror Stories

We are actively looking for contributions in the following areas:

- **New Events:** Add real-world disasters (e.g., "Certificate Expiry", "Flash Memory Corruption").
- **New Devices:** specific IoT horror archetypes (e.g., "Smart Toaster").
- **Localization:** Translate the game into your language.

### How to Contribute

1.  **Report Issues:** Found a bug? Have a suggestion? [Open an Issue](https://github.com/deviceprophet/hardware-is-hard/issues).
2.  **Submit Pull Requests:**
    - **Events:** Edit `src/data/events.json` to add new scenarios.
    - **Devices:** Edit `src/data/devices.json` to add new hardware.
    - **Localization:** Add a new folder in `src/locales/` (e.g., `de/translation.json`) and update `i18n.ts`.

Check out the `src/data/` folder to see how easy it is to add content!

## 🧑‍💻 Development Setup

```bash
# Install dependencies
pnpm install

# Start (Development)
pnpm dev

# Run tests
pnpm test
```

### Third Party Licenses

- **Fira Code Font**: Licensed under SIL Open Font License 1.1. Copyright (c) 2014, The Fira Code Project Authors.

## 🔒 Privacy

**The Recall Run** is a pure client-side simulation.

- **No Server:** All logic runs in your browser.
- **No Tracking:** We do not use cookies or tracking pixels.
- **Stateless Sharing:** Shared results are encoded in the URL (Base64). No database is involved.

---

© 2026 Device Prophet. [Privacy Policy](https://deviceprophet.com/privacy)
