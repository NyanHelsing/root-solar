# Branchless, Single‑Mention, Pipeline‑First JavaScript/TypeScript

**Thesis:** Normalize inputs early, prefer expressions over statements, and compose work as branchless pipelines. This reduces cognitive load, avoids repetition, and makes behavior easier to reason about and test.

---

## Motivation

Most day‑to‑day JS/TS code is harder to read than it needs to be:

* **Incidental control flow:** Chains of `if`/`for` obscure the “what” with the “how.”
* **Symbol repetition:** Repeating identifiers and conditions spreads intent across lines.
* **Mutation by default:** In‑place updates introduce hidden coupling and make tests brittle.
* **Fragmented shapes:** Accepting many shapes at API boundaries forces callers and callees to branch.

A pipeline‑first style replaces incidental complexity with **uniform shapes**, **single‑mention variables**, and **expression pipelines**. You get:

* Code you can skim: inputs → transforms → output.
* Fewer edge‑case bugs: identity defaults (e.g., `[]`) make “nothing” a no‑op.
* Easier refactors: pure transformations, less shared state.
* Predictable performance characteristics (and easy hot‑path escape hatches when needed).

---

## Core Principles

1. **Normalize early.**
   Convert varied inputs into canonical shapes at boundaries (usually arrays, objects, `Map`/`Set`).

2. **Prefer expressions over statements.**
   Use `?.`, `??`, `?:`, `.map/.filter/.flatMap/.reduce`, `.some/.every/.find` in place of branching mutations.

3. **Single‑mention.**
   Bind once, then transform; avoid repeating the same expression or identifier.

4. **Branchless pipelines.**
   Compose transformations instead of sprinkling `if` checks through loops.

5. **Immutability by default.**
   Prefer non‑mutating methods (`toSorted`, `toSpliced`, `with`) and pure functions.

6. **Table‑driven dispatch.**
   Replace `switch`/if‑else ladders with data lookups (objects or `Map`).

7. **Identity defaults.**
   Treat absence as the identity of the operation (`[]`, `{}`, `''`, `0`, `() => {}`) so empty inputs flow through pipelines without branches.

> The “one‑or‑many” idiom—`[eitherItemOrItemArray].flat()`—is a concrete example of these principles: normalize shape, single mention, branchless.

---

## How To Adopt (Team‑Level)

* **APIs accept one‑or‑many and arrays:** Normalize at the entry point (e.g., `[x ?? []].flat()`).
* **Default everything:** Parameter defaults and destructuring eliminate sentinel branches.
* **Prefer modern array & object combinators:** `toSorted`, `toSpliced`, `with`, `Object.entries`, `Object.fromEntries`.
* **Use `Map`/`Set` for membership, uniqueness, and stable iteration.**
* **Async rule of thumb:** `await Promise.all(items.map(task))` unless you *intentionally* want sequential behavior.
* **Lint to reinforce:** Prefer array methods, forbid mutation in non‑hot code paths, and enable modern preferences.
* **Provide tiny helpers:** `asArray`, `asArrayOrEmpty`, `chunk`, `groupBy`, `byId`—small, obvious utilities that seed pipelines.

---

## Specific Examples (Before → After)

### 1) One‑or‑many normalization (no conditionals)

**Before**

```js
function run(plugins) {
    const list = Array.isArray(plugins) ? plugins : [plugins];
    for (const p of list) p();
}
```

**After**

```js
function run(plugins) {
    for (const p of [plugins].flat()) p();
}
```

**Absent ⇒ empty**

```js
const ids = [req.query.id ?? []].flat();
```

---

### 2) Prefer `.map()` over loops for transforms

**Before**

```js
const squares = [];
for (let i = 0; i < nums.length; i++) {
    squares.push(nums[i] * nums[i]);
}
```

**After**

```js
const squares = nums.map(n => n * n);
```

---

### 3) Early‑exit intents (`some`/`every`/`find`)

```js
const hasInvalid = xs.some(x => !isValid(x));
const firstInvalid = xs.find(x => !isValid(x));
const allValid = xs.every(isValid);
```

---

### 4) Zero/one/many expansion with `flatMap`

**Before**

```js
const tags = [];
for (const u of users) {
    for (const t of getTags(u)) tags.push(t);
}
```

**After**

```js
const tags = users.flatMap(getTags);
```

---

### 5) Table‑driven dispatch over `switch`

**Before**

```js
let handler;
if (kind === 'csv') handler = parseCsv;
else if (kind === 'json') handler = parseJson;
else if (kind === 'xml') handler = parseXml;
else handler = parseUnknown;
const data = handler(body);
```

**After**

```js
const handlers = { csv: parseCsv, json: parseJson, xml: parseXml };
const data = (handlers[kind] ?? parseUnknown)(body);
```

---

### 6) Immutability by default

**Before**

```js
list.sort(compare);
list.splice(index, 1, next);
list[2] = value;
```

**After**

```js
const sorted = list.toSorted(compare);
const replaced = list.toSpliced(index, 1, next);
const updated = list.with(2, value);
```

---

### 7) Membership & de‑dupe with `Map`/`Set`

```js
// unique by id
const unique = Array.from(new Map(items.map(x => [x.id, x])).values());

// filter by allowed types
const allowed = new Set(whitelist);
const filtered = items.filter(x => allowed.has(x.type));
```

---

### 8) String building via arrays (no conditional concatenation)

**Before**

```js
let cmd = 'git';
if (branch) cmd += ` -b ${branch}`;
if (depth) cmd += ` --depth=${depth}`;
```

**After**

```js
const cmd = [
    'git',
    branch && `-b ${branch}`,
    depth && `--depth=${depth}`
].filter(Boolean).join(' ');
```

---

### 9) Guard clauses instead of nested `if`s

**Before**

```js
function submit(input) {
    if (input) {
        if (isValid(input)) {
            return save(input);
        } else {
            return report('invalid');
        }
    } else {
        return report('missing');
    }
}
```

**After**

```js
function submit(input) {
    if (!input) return report('missing');
    if (!isValid(input)) return report('invalid');
    return save(input);
}
```

---

### 10) Defaults + destructuring remove sentinel checks

**Before**

```js
function connect(opts) {
    const host = opts && opts.host ? opts.host : 'localhost';
    const port = opts && opts.port ? opts.port : 5432;
    return dial(host, port);
}
```

**After**

```js
function connect({ host = 'localhost', port = 5432 } = {}) {
    return dial(host, port);
}
```

---

### 11) Optional paths with `?.`/`??`

```js
const name = user?.profile?.name ?? 'Anonymous';
```

---

### 12) Declarative async mapping

**Before (sequential)**

```js
const results = [];
for (const id of ids) {
    results.push(await fetchOne(id));
}
```

**After (concurrent)**

```js
const results = await Promise.all(ids.map(fetchOne));
```

**Batched concurrency**

```js
const chunk = (xs, n) => xs.length ? [xs.slice(0, n), ...chunk(xs.slice(n), n)] : [];
const results = (await Promise.all(
    chunk(ids, 5).map(batch => Promise.all(batch.map(fetchOne)))
)).flat();
```

---

### 13) `Object.entries` + `fromEntries` as object pipelines

**Before**

```js
const res = {};
for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
        res[k] = transform(obj[k]);
    }
}
```

**After**

```js
const res = Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, transform(v)])
);
```

---

### 14) Query strings with `URLSearchParams`

**Before**

```js
let query = '';
for (const k in params) {
    const v = params[k];
    if (Array.isArray(v)) {
        for (const x of v) query += `&${k}=${encodeURIComponent(x)}`;
    } else {
        query += `&${k}=${encodeURIComponent(v)}`;
    }
}
```

**After**

```js
const pairs = Object.entries(params).flatMap(([k, v]) => [v].flat().map(x => [k, x]));
const qs = new URLSearchParams(pairs).toString();
```

---

### 15) Regex extraction with `matchAll`

**Before**

```js
const emails = [];
let m;
while ((m = re.exec(text)) !== null) {
    emails.push(m[1]);
}
```

**After**

```js
const emails = [...text.matchAll(re)].map(([, email]) => email);
```

---

### 16) End‑oriented indexing with `.at()`

```js
const last = arr.at(-1);
const thirdFromEnd = arr.at(-3);
```

---

### 17) Error aggregation (pipeline‑friendly)

**Before**

```js
function raise(errors) {
    const list = Array.isArray(errors) ? errors : [errors];
    throw new AggregateError(list, 'Validation failed');
}
```

**After**

```js
function raise(errors) {
    throw new AggregateError([errors].flat(), 'Validation failed');
}
```

---

### 18) Compose processing steps as arrays

**Before**

```js
let out = input;
out = step1(out);
out = step2(out);
if (flag) out = step3(out);
out = step4(out);
```

**After**

```js
const pipeline = [step1, step2, flag && step3, step4].filter(Boolean);
const out = pipeline.reduce((v, f) => f(v), input);
```

---

### 19) DOM/class utilities that accept one or many

```js
function addClasses(el, classes) {
    [classes].flat().forEach(c => el.classList.add(c));
}
```

---

### 20) Data reshaping: index & group

```js
const byId = Object.fromEntries(items.map(i => [i.id, i]));
const groupBy = (xs, key) =>
    xs.reduce((acc, x) => ((acc[x[key]] ??= []).push(x), acc), {});
```

---

## Minimal Utilities (JS/TS)

```ts
type OneOrMany<T> = T | readonly T[];

export function asArray<T>(x: OneOrMany<T>): T[] {
    return [x].flat() as T[];
}

export function asArrayOrEmpty<T>(x: OneOrMany<T> | null | undefined): T[] {
    return [x ?? []].flat() as T[];
}
```

These keep call sites terse and branchless:

```ts
for (const plugin of asArrayOrEmpty(opts.plugins)) {
    plugin();
}
```

---

## Linting & Tooling Hints

* **Rules**

  * `unicorn/prefer-array-flat`, `unicorn/prefer-array-flat-map`, `unicorn/prefer-at`
  * `array-callback-return`, `prefer-const`
  * Consider `eslint-plugin-functional`/`eslint-plugin-fp` to discourage mutation in non‑hot paths.

* **Custom rule idea**

  * Flag `Array.isArray(x) ? x : [x]` in favor of `[x].flat()` (allow opt‑out where identity matters).

---

## Caveats & Escape Hatches

* **Referential identity:**
  `[arr].flat()` always returns a new array. If a downstream consumer depends on *the same reference* when input is already an array, preserve identity:

  ```js
  const out = Array.isArray(x) ? x : [x];
  ```

* **Nullish handling:**
  `[x].flat()` ⇒ `[undefined]` when `x` is `undefined`. If you want “absent ⇒ empty,” use `[x ?? []].flat()`.

* **Performance hot paths:**
  Pipelines are usually plenty fast in Node 20+ and modern browsers. If profiling shows a true hotspot, drop to a tight imperative loop *in that one place* and comment why.

* **Iterables vs arrays:**
  `[iterable].flat()` does **not** spread it. Normalize iterables explicitly:

  ```js
  const arr = Array.isArray(x) ? x : (x?.[Symbol.iterator] ? [...x] : [x]);
  ```

---

## Sticky‑Note Checklist

* Normalize at boundaries → **`[x ?? []].flat()`**, `Object.entries`, `Map`/`Set`.
* Expressions over statements → `?.`, `??`, `?:`, `.map/.filter/.flatMap/.reduce`.
* Single‑mention → destructuring, param defaults, table‑driven dispatch.
* Immutable by default → `toSorted`, `toSpliced`, `with`.
* Async → `await Promise.all(items.map(task))` (batch if needed).
* Strings → build arrays, `filter(Boolean)`, `join(' ')`.

Adopt these and your codebase gains consistency, predictability, and speed of comprehension—without sacrificing flexibility when you truly need it.

