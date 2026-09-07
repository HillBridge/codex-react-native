# Expo SDK 57 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Expo React Native project from SDK 54 to SDK 57 so it can run in the installed Expo Go SDK 57 app.

**Architecture:** Upgrade one Expo SDK at a time (54 → 55 → 56 → 57). At each boundary, Expo CLI will align Expo-managed dependencies and Expo Doctor plus the repository's quality checks will identify regressions before proceeding. The repository has no `ios/` or `android/` directories, so no native-project migration is required.

**Tech Stack:** Expo SDK, React Native, Expo Router, pnpm 11, TypeScript, ESLint, Prettier.

**Spec:** User request in this Codex task: “你帮我把`expo`逐步升级到57版本”; [Expo SDK upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

## Global Constraints

- Preserve all existing working-tree changes; do not reset, checkout, or remove them.
- Do not change application behavior except for SDK-required compatibility edits.
- Upgrade SDK versions incrementally: 54 → 55 → 56 → 57.
- Use Node.js 22.13.x or newer but below 23 for the SDK 57 stage.
- Run `pnpm exec expo-doctor` and `pnpm quality` after every SDK stage.

---

### Task 1: Capture the SDK 54 baseline

**Files:**

- Inspect: `package.json`, `pnpm-lock.yaml`, `app.json`, `.nvmrc`
- Test: `pnpm exec expo-doctor`, `pnpm quality`

**Interfaces:**

- Consumes: The existing SDK 54 dependency graph and user working-tree changes.
- Produces: A recorded baseline of diagnostics and quality results used to distinguish pre-existing failures from upgrade regressions.

- [ ] **Step 1: Confirm the active Node and pnpm versions**

Run: `node --version && pnpm --version`

Expected: Node is at least 20.19.4 for the first two upgrade stages and pnpm is 11 or newer.

- [ ] **Step 2: Run Expo Doctor against SDK 54**

Run: `pnpm exec expo-doctor`

Expected: Any existing diagnostics are recorded before changing dependencies.

- [ ] **Step 3: Run the repository quality suite**

Run: `pnpm quality`

Expected: TypeScript, lint, and formatting results are recorded before changing dependencies.

### Task 2: Upgrade SDK 54 to SDK 55

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `package.json` dependency graph, `pnpm exec expo-doctor`, `pnpm quality`

**Interfaces:**

- Consumes: The verified SDK 54 dependency graph.
- Produces: An SDK 55-compatible set of Expo, React, React Native, Expo Router, and Expo module versions.

- [ ] **Step 1: Install the Expo SDK 55 package**

Run: `pnpm add expo@^55.0.0`

Expected: `package.json` records an SDK 55 `expo` range and pnpm updates the lockfile.

- [ ] **Step 2: Align Expo-managed dependencies**

Run: `pnpm exec expo install --fix`

Expected: Expo CLI selects SDK 55-compatible versions for Expo packages, React, and React Native.

- [ ] **Step 3: Check SDK diagnostics**

Run: `pnpm exec expo-doctor`

Expected: No unresolved SDK 55 version mismatch remains.

- [ ] **Step 4: Run project quality checks**

Run: `pnpm quality`

Expected: Any regression introduced by SDK 55 is identified before advancing to SDK 56.

### Task 3: Upgrade SDK 55 to SDK 56

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `package.json` dependency graph, `pnpm exec expo-doctor`, `pnpm quality`

**Interfaces:**

- Consumes: The resolved SDK 55 dependency graph.
- Produces: An SDK 56-compatible dependency graph.

- [ ] **Step 1: Install the Expo SDK 56 package**

Run: `pnpm add expo@^56.0.0`

Expected: `package.json` records an SDK 56 `expo` range and pnpm updates the lockfile.

- [ ] **Step 2: Align Expo-managed dependencies**

Run: `pnpm exec expo install --fix`

Expected: Expo CLI updates the project to the SDK 56-supported React Native 0.85 and React 19.2 dependency family.

- [ ] **Step 3: Check SDK diagnostics**

Run: `pnpm exec expo-doctor`

Expected: No unresolved SDK 56 version mismatch remains.

- [ ] **Step 4: Run project quality checks**

Run: `pnpm quality`

Expected: Any regression introduced by SDK 56 is identified before advancing to SDK 57.

### Task 4: Upgrade SDK 56 to SDK 57 and raise the Node floor

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.nvmrc`
- Test: `node --version`, `pnpm exec expo-doctor`, `pnpm quality`

**Interfaces:**

- Consumes: The resolved SDK 56 dependency graph.
- Produces: An SDK 57-compatible project that can open in Expo Go SDK 57.

- [ ] **Step 1: Use a supported Node.js version**

Run: `node --version`

Expected: Node is at least `v22.13.0`. Update `.nvmrc` to `22.13.0` so future developers use the SDK 57 minimum version.

- [ ] **Step 2: Install the Expo SDK 57 package**

Run: `pnpm add expo@^57.0.0`

Expected: `package.json` records an SDK 57 `expo` range and pnpm updates the lockfile.

- [ ] **Step 3: Align Expo-managed dependencies**

Run: `pnpm exec expo install --fix`

Expected: Expo CLI updates the project to the SDK 57-supported React Native 0.86 and React 19.2.3 dependency family.

- [ ] **Step 4: Apply release-note-required compatibility edits only if diagnostics identify them**

Run: `pnpm exec expo-doctor`

Expected: Expo Doctor reports no SDK version mismatches. If it reports an incompatible package or configuration, edit only the named configuration or dependency and rerun this command.

- [ ] **Step 5: Run the full quality suite**

Run: `pnpm quality`

Expected: TypeScript, lint, and formatting pass, or remaining failures are identified explicitly.

### Task 5: Verify Expo Go SDK 57 loading

**Files:**

- Inspect: `package.json`, `app.json`
- Test: `pnpm start:sandbox -- --tunnel --clear`

**Interfaces:**

- Consumes: SDK 57 dependency and configuration state.
- Produces: A clean Metro session that Expo Go SDK 57 can load.

- [ ] **Step 1: Confirm the Expo version**

Run: `node -e "const p=require('./package.json'); console.log(p.dependencies.expo)"`

Expected: An SDK 57 range is printed.

- [ ] **Step 2: Start Metro with a clean cache**

Run: `pnpm start:sandbox -- --tunnel --clear`

Expected: Metro starts and identifies the project as compatible with Expo Go, producing a fresh QR code.

- [ ] **Step 3: Verify on the physical iPhone**

Scan the fresh QR code from the iPhone Camera app and open it in Expo Go.

Expected: Expo Go no longer reports an SDK 54/57 incompatibility and Metro logs the bundle request.
