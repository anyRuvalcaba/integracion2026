import { describe, it, expect, vi, beforeEach } from "vitest";
import { validationResult } from "express-validator";
import validate from "../../../middlewares/validation.js";

vi.mock("express-validator", () => ({
  validationResult: vi.fn(),
}));

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("validate middleware — tests unitarios", () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("UT-MW-010: sin errores de validación → next() llamado", () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const req = {};
    const res = mockRes();

    validate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("UT-MW-011: con errores de validación → 422 con errors array", () => {
    const errorsArray = [
      { type: "field", msg: "name is required", path: "name" },
    ];
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errorsArray,
    });
    const req = {};
    const res = mockRes();

    validate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ errors: errorsArray });
    expect(next).not.toHaveBeenCalled();
  });
});
