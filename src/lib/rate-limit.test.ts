import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";
describe("rate limit",()=>{it("bloqueia após o limite",()=>{const key=`test:${crypto.randomUUID()}`;expect(rateLimit(key,2,1000).allowed).toBe(true);expect(rateLimit(key,2,1000).allowed).toBe(true);expect(rateLimit(key,2,1000).allowed).toBe(false);});});

