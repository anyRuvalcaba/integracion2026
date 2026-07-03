import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import errorHandler from "../../../middlewares/errorHandler.js";

// Mock fs para no escribir en disco durante los tests
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    appendFile: vi.fn((path, msg, cb) => cb(null)),
  },
}));

function mockReq(overrides = {}) {
  return { method: "GET", url: "/api/test", ...overrides };
}

function mockRes() {
  const res = {};
  res.headersSent = false;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler middleware — tests unitarios", () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UT-MW-012: responde 500 con { status: 'error', message: 'Internal Server Error' }", () => {
    const req = mockReq();
    const res = mockRes();
    const err = new Error("algo falló");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal Server Error",
    });
  });

  it("UT-MW-013: llama a fs.appendFile para escribir en el log", () => {
    const req = mockReq();
    const res = mockRes();
    const err = new Error("error de log");

    errorHandler(err, req, res, next);

    expect(fs.appendFile).toHaveBeenCalledOnce();
    const [logPath, logMessage] = fs.appendFile.mock.calls[0];
    expect(logPath).toContain("error.log");
    expect(logMessage).toContain("error de log");
  });

  it("UT-MW-014: no envía respuesta si res.headersSent es true", () => {
    const req = mockReq();
    const res = mockRes();
    res.headersSent = true;
    const err = new Error("error después de response");

    errorHandler(err, req, res, next);

    expect(res.status).not.toHaveBeenCalled();
  });
});
