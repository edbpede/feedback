/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: { authenticated: boolean; timestamp: number } | null;
  }
}

export {};
