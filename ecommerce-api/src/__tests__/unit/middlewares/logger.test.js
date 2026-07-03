import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import logger from "../../../middlewares/logger.js";

describe("logger middleware — tests unitarios", () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("UT-LOG-001: llama next() siempre", () => {
    const req = { method: "GET", url: "/api/products" };
    const res = {};

    logger(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("UT-LOG-002: llama console.log con method y url del request", () => {
    const req = { method: "POST", url: "/api/auth/login" };
    const res = {};

    logger(req, res, next);

    expect(console.log).toHaveBeenCalledOnce();
    const logArg = console.log.mock.calls[0][0];
    expect(logArg).toContain("POST");
    expect(logArg).toContain("/api/auth/login");
  });

  it("UT-LOG-003: el log incluye un timestamp ISO 8601", () => {
    const req = { method: "GET", url: "/api/test" };
    const res = {};

    logger(req, res, next);

    const logArg = console.log.mock.calls[0][0];
    // El formato es: "2026-06-25T..." — empieza con 4 dígitos del año
    expect(logArg).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
