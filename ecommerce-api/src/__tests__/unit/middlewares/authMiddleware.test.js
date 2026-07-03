import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const SECRET = "test-jwt-secret-vitest";

function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("authMiddleware — tests unitarios", () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
    process.env.JWT_SECRET = SECRET;
  });

  // ── Sin token ───────────────────────────────────────────────────────────────

  it("UT-MW-001: sin header Authorization → 401 Unauthorized", () => {
    const req = mockReq({});
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-002: header Authorization sin prefijo Bearer → 401", () => {
    // split(" ")[1] devuelve undefined cuando no hay espacio → !token
    const req = mockReq({ authorization: "sinBearer" });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-003: token string inválido → 401 Invalid or expired token", () => {
    const req = mockReq({ authorization: "Bearer not.a.valid.token" });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-004: token expirado → 401 Invalid or expired token", () => {
    const expired = jwt.sign({ userId: "x", role: "customer" }, SECRET, {
      expiresIn: "-1s",
    });
    const req = mockReq({ authorization: `Bearer ${expired}` });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-005: token válido → next() llamado, sin response", () => {
    const token = jwt.sign(
      { userId: "abc123", name: "Alice", role: "customer" },
      SECRET,
      { expiresIn: "1h" },
    );
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("UT-MW-006: token válido → req.user contiene { userId, name, role }", () => {
    const payload = { userId: "abc123", name: "Alice", role: "customer" };
    const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(req.user.userId).toBe(payload.userId);
    expect(req.user.name).toBe(payload.name);
    expect(req.user.role).toBe(payload.role);
  });
});
