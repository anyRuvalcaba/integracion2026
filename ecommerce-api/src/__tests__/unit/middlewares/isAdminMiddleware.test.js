import { describe, it, expect, vi, beforeEach } from "vitest";
import isAdmin from "../../../middlewares/isAdminMiddleware.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("isAdminMiddleware — tests unitarios", () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  it("UT-MW-007: sin req.user → 401 Authentication is required", () => {
    const req = {};
    const res = mockRes();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Authentication is required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-008: req.user.role = customer → 403 Admin access required", () => {
    const req = { user: { role: "customer" } };
    const res = mockRes();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("UT-MW-009: req.user.role = admin → next() llamado sin response", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
