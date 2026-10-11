# Trip Splitter (Frontend Assignment)

A small expense splitting app for five friends on a Goa trip, built with React, Redux Toolkit, and strict TypeScript. It runs completely in the browser with no backend.

---

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Start the dev server:
```bash
npm run dev
```

3. Run the tests:
```bash
npm test
```

4. Check types and linting:
```bash
npm run typecheck
npm run lint
```

Everything asked for in the brief is implemented. There is no missing core feature.

---

## Expected Outputs

### `npm test` (all 17 unit and form tests pass)
```text
 RUN  v2.1.9 C:/Recruiterflow/frontend

 ✓ src/test/unit.test.ts (14 tests) 130ms
 ✓ src/test/form.test.tsx (3 tests) 612ms

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  08:55:43
   Duration  5.34s
```

### `npm run typecheck`
```text
> trip-splitter@1.0.0 typecheck
> tsc --noEmit
```
*(Exits with code 0 under `"strict": true`)*

### `npm run lint`
```text
> trip-splitter@1.0.0 lint
> eslint src
```
*(Exits with code 0 and zero warnings)*

---

## Three Decisions and Why

### 1. Integer Paise Math
JavaScript floats can introduce rounding issues (like `0.1 + 0.2 === 0.30000000000000004`). To make sure no money gets lost, every amount is stored internally as integer paise (`₹1,250.50` is `125050`). We only convert to rupee strings when reading form inputs or formatting for the UI.

### 2. Remainder Paisa Distribution
When an amount doesn't split evenly (like ₹100 split 3 ways: 10,000 paise / 3 = 3,333 with 1 paisa left over), I give that remaining paisa to the first person in the list:
- Person 1 gets ₹33.34
- Person 2 gets ₹33.33
- Person 3 gets ₹33.33

This rule is used across equal and percentage splits, meaning the shares always add up to the exact expense amount, and all balances across the group always sum to exactly ₹0.

### 3. Business Logic Outside React & Redux Subscriber for Storage
All the money conversion, split math, balance calculation, and form checks live in plain TypeScript files (`utils/`). This kept the React components simple and made it easy to write fast unit tests with Vitest without mounting any DOM. For `localStorage`, instead of writing `useEffect` hooks in components, I used `store.subscribe()` right on the Redux store so changes save automatically whenever state updates.

---

## What I'd Add with More Time
- **Simplify Debts**: Right now it shows everyone's net balance ("owes ₹X", "gets back ₹X"). I'd add a small algorithm that calculates the fewest peer-to-peer transfers needed to settle everyone up (e.g. "Aarav pays Kabir ₹150").
- **Offline / PWA**: Add a service worker so the group could keep logging expenses on the go even without mobile data.
