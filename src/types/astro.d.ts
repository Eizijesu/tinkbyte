// src/types/astro.d.ts - Astro type definitions
/// <reference types="astro/client" />

declare module 'astro:content' {
    export function getCollection(collection: string, filter?: (entry: any) => boolean): Promise<any[]>;
    export function getEntry(collection: string, slug: string): Promise<any>;
    export function getEntries(references: any[]): Promise<any[]>;
  }
  
  // Extend the global namespace for better IntelliSense
  declare global {
    namespace App {
      interface Locals {}
    }
  }