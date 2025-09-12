// TypeScript definitions for Cloudflare bindings
interface Env {
    DB: D1Database;
    KV: KVNamespace;
    R2: R2Bucket;
}

// Extend Cloudflare types to include environment
declare global {
    interface CloudflareBindings extends Env {}
}

export { Env };