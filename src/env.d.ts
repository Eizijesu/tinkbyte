// src/env.d.ts - Environment type declarations (FIXED)
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // TinaCMS
  readonly TINA_CLIENT_ID: string;
  readonly TINA_TOKEN: string;
  readonly TINA_BRANCH: string;
  
  // ConvertKit
  readonly PUBLIC_CONVERTKIT_FORM_ID: string;
  readonly CONVERTKIT_API_KEY: string;
  
  // Giscus
  readonly PUBLIC_GISCUS_REPO: string;
  readonly PUBLIC_GISCUS_REPO_ID: string;
  readonly PUBLIC_GISCUS_CATEGORY: string;
  readonly PUBLIC_GISCUS_CATEGORY_ID: string;
  readonly PUBLIC_GISCUS_MAPPING: string;
  readonly PUBLIC_GISCUS_STRICT: string;
  readonly PUBLIC_GISCUS_REACTIONS_ENABLED: string;
  readonly PUBLIC_GISCUS_EMIT_METADATA: string;
  readonly PUBLIC_GISCUS_INPUT_POSITION: string;
  readonly PUBLIC_GISCUS_THEME: string;
  readonly PUBLIC_GISCUS_LANG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Astro global types
declare namespace App {
  interface Locals {
    // Add any local variables here if needed
  }
}