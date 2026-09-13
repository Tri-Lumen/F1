// Flat ESLint config for Next.js 16 + React 19 + TypeScript.
//
// Next.js 16 removed the built-in `next lint` command, so linting is wired
// up directly through ESLint's own flat-config format instead. As of the
// Next 16-compatible eslint-config-next release, `eslint-config-next`
// already ships native flat-config presets (no `FlatCompat` bridging to the
// legacy `.eslintrc`-style `next/core-web-vitals` needed).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist-electron/**",
      "design-preview/**",
      "build/**",
      "out/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
  ...nextCoreWebVitals,
  // Scope typescript-eslint's rules to actual TypeScript files. Its
  // "recommended" preset ships some entries with no `files` restriction of
  // their own (they're meant to be scoped by the consumer), which would
  // otherwise also apply TS-only rules like no-require-imports to plain
  // CommonJS scripts (electron/*.js) that legitimately use require().
  ...tseslint.config({
    files: ["**/*.ts", "**/*.tsx"],
    extends: [tseslint.configs.recommended],
  }),
  {
    // Scoped to ts/tsx (same as above) — these are @typescript-eslint rules,
    // so this block must only match files where that plugin is registered.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Pre-existing debt across a large codebase — keep as warnings so the
      // command's exit code reflects real errors, not stylistic nits.
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // src/ is application code that's out of scope for this lint-tooling
    // change to modify (only new test files were added under src/ here).
    // These rules flag genuine pre-existing patterns there — mostly the
    // newer eslint-plugin-react-hooks "React Compiler" rules (e.g.
    // set-state-in-effect on the common load-from-localStorage-then-
    // setMounted effect pattern) plus a couple of prefer-const spots and
    // one Next-specific false positive (global-error.tsx is required to
    // use a plain <a>, not <Link>, since it replaces the root layout when
    // a root-level error occurs). Downgraded to warnings here so `npm run
    // lint` reports them without failing on debt this change didn't
    // introduce; they stay full errors everywhere else, including new code.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "prefer-const": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/error-boundaries": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default config;
