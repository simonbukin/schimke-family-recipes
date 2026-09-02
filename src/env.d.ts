/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Name of the signed-in editor, or undefined for anonymous visitors. */
    editor?: string;
  }
}
