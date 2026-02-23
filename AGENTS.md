# Vercel React & Next.js Best Practices (Expanded)

This document provides a comprehensive guide to elite performance optimization patterns for React and Next.js applications, as used by Vercel Engineering.

## 1. Eliminating Waterfalls (CRITICAL)

### `async-defer-await`
**Why**: Avoid blocking the entire request for data that is only needed in certain conditions.
- **Incorrect**:
  ```tsx
  const data = await fetchData();
  if (!shouldShow) return null;
  return <Component data={data} />;
  ```
- **Correct**:
  ```tsx
  if (!shouldShow) return null;
  const data = await fetchData();
  return <Component data={data} />;
  ```

### `async-parallel`
**Why**: Fetching independent data sequentially adds up latency.
- **Incorrect**:
  ```tsx
  const user = await getUser();
  const posts = await getPosts();
  ```
- **Correct**:
  ```tsx
  const [user, posts] = await Promise.all([getUser(), getPosts()]);
  ```

### `async-suspense-boundaries`
**Why**: Allows the shell to render immediately while heavy data streams in.
- **Correct**: Wrap slow data-fetching components in `<Suspense fallback={<Skeleton />} />`.

---

## 2. Bundle Size Optimization (CRITICAL)

### `bundle-barrel-imports`
**Why**: Importing from a barrel file (`index.ts`) often forces the bundler to include every component in that folder, even if you only use one.
- **Incorrect**: `import { Button } from '@/components/ui';`
- **Correct**: `import { Button } from '@/components/ui/Button';`

### `bundle-dynamic-imports`
**Why**: heavy libraries like charts, maps, or PDF generators should only be loaded when needed.
- **Correct**:
  ```tsx
  const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });
  ```

---

## 3. Server-Side Performance (HIGH)

### `server-cache-react`
**Why**: Deduplicate data fetching within a single request.
- **Correct**: Use `React.cache()` for functions that are called multiple times in different components during one render cycle.

### `server-serialization`
**Why**: Large JSON objects passed from Server to Client components increase HTML size and hydration time.
- **Correct**: Only pass necessary fields, not the whole database object.

---

## 4. Re-render Optimization (MEDIUM)

### `rerender-memo`
**Why**: Prevent children from re-rendering if their props haven't changed.
- **Correct**: Use `React.memo` for leaf components in large lists.

### `rerender-lazy-state-init`
**Why**: `useState(expensiveCalculation())` runs on every render.
- **Correct**: `useState(() => expensiveCalculation())` runs only once.

---

[More rules follow the same pattern...]
*(Note: Full guide contains 45 rules as listed in SKILL.md)*
