import { defineConfig } from "orval";

/**
 * Public API client from `public/openapi.yaml`.
 * Regenerate: `npm run api:generate`
 */
export default defineConfig({
  nullxesPublicApi: {
    input: {
      target: "./public/openapi.yaml",
    },
    output: {
      mode: "single",
      target: "./src/features/public-api/generated/client.ts",
      schemas: "./src/features/public-api/generated/models",
      client: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "./src/features/public-api/lib/custom-fetch.ts",
          name: "customFetch",
        },
      },
    },
  },
});
