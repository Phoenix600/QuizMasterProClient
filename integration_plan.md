# Implementation Plan - Integrate Code-Graph UI into QuizMasterProClient

This plan outlines the steps to integrate the `code-graph` coding workspace UI into the `QuizMasterProClient` application.

## 1. Preparation
### 1.1 Folder Structure
- Create `QuizMasterProClient/src/features/codegraph` directory.
- Subdirectories: `components`, `hooks`, `lib`, `assets`.

### 1.2 Copying Files
From `code-graph/src`:
- `components/*` -> `QuizMasterProClient/src/features/codegraph/components/`
- `hooks/*` -> `QuizMasterProClient/src/features/codegraph/hooks/`
- `lib/*` -> `QuizMasterProClient/src/features/codegraph/lib/`
- `types.ts` -> `QuizMasterProClient/src/features/codegraph/types.ts`
- `constants.ts` -> `QuizMasterProClient/src/features/codegraph/constants.ts`

## 2. Dependencies
Install missing dependencies in `QuizMasterProClient`:
- `react-resizable-panels`
- `react-markdown`
- `sonner`
- `remark-gfm`
- `clsx`
- `tailwind-merge`
- `react-player` (used in `VideoPlayer.tsx`)

## 3. Refactoring & Cleanup
- Update all imports in the copied components to point to the new internal paths.
- Adapt `features/codegraph/lib/api.ts` to use the base configuration of `QuizMasterProClient` if necessary, or keep it separate for now.
- Fix any CSS conflicts (Code-Graph uses Tailwind 4, same as QuizMasterPro).

## 4. Integration in QuizMasterPro
### 4.1 Update App.tsx
- Add `coding` to the `View` type.
- Add state for `coding` view.
- Render the `CodeGraph` main layout when `view === 'coding'`.

### 4.2 UI Entry Point
- Add a "Coding Challenges" link/button in `DashboardView` and `HomeView`.

## 5. Verification
- Verify navigation to the Coding Workspace.
- Verify problem fetching and content rendering.
- Verify code execution (Backend `CodeGraph` must be running).
