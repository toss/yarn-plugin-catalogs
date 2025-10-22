import { describe, it, expect } from "vitest";
import { InheritanceResolver } from "../utils/inheritance";

describe("inheritance utilities", () => {
  const inheritanceService = new InheritanceResolver();

  describe("getInheritanceChain", () => {
    it("should return chain for single level group", () => {
      expect(inheritanceService.getInheritanceChain("stable")).toEqual([
        "stable",
      ]);
    });

    it("should return chain for two level group", () => {
      expect(inheritanceService.getInheritanceChain("stable/canary")).toEqual([
        "stable",
        "stable/canary",
      ]);
    });

    it("should return chain for three level group", () => {
      expect(
        inheritanceService.getInheritanceChain("stable/canary/next"),
      ).toEqual(["stable", "stable/canary", "stable/canary/next"]);
    });
  });

  describe("resolveInheritance", () => {
    it("should resolve single level without inheritance", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
      };

      const resolved = inheritanceService.resolveInheritance(
        "stable",
        catalogs,
      );
      expect(resolved).toEqual({
        react: "npm:18.0.0",
        lodash: "npm:4.17.21",
      });
    });

    it("should resolve one level inheritance", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          typescript: "npm:5.2.0",
        },
      };

      const resolved = inheritanceService.resolveInheritance(
        "stable/canary",
        catalogs,
      );
      expect(resolved).toEqual({
        react: "npm:18.2.0", // overridden
        lodash: "npm:4.17.21", // inherited
        typescript: "npm:5.2.0", // overridden
      });
    });

    it("should resolve multi-level inheritance", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          typescript: "npm:5.2.0",
        },
        "stable/canary/next": {
          react: "npm:18.3.0",
        },
      };

      const resolved = inheritanceService.resolveInheritance(
        "stable/canary/next",
        catalogs,
      );
      expect(resolved).toEqual({
        react: "npm:18.3.0", // overridden at leaf
        lodash: "npm:4.17.21", // inherited from stable
        typescript: "npm:5.2.0", // inherited from stable/canary
      });
    });

    it("should throw error when parent group doesn't exist", () => {
      const catalogs = {
        "stable/canary": {
          react: "npm:18.0.0",
        },
      };

      expect(() =>
        inheritanceService.resolveInheritance("stable/canary", catalogs),
      ).toThrow('Catalog group "stable" not found in inheritance chain');
    });

    it("should throw error when middle parent doesn't exist", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
        },
        "stable/canary/next": {
          react: "npm:18.3.0",
        },
      };

      expect(() =>
        inheritanceService.resolveInheritance("stable/canary/next", catalogs),
      ).toThrow('Catalog group "stable/canary" not found in inheritance chain');
    });
  });

  describe("resolveAllGroups", () => {
    it("should resolve all groups with inheritance", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
        beta: {
          react: "npm:19.0.0",
        },
      };

      const resolved = inheritanceService.resolveAllGroups(catalogs);

      expect(resolved).toEqual({
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          lodash: "npm:4.17.21",
        },
        beta: {
          react: "npm:19.0.0",
        },
      });
    });

    it("should handle complex inheritance tree", () => {
      const catalogs = {
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
        },
        "stable/canary/next": {
          typescript: "npm:5.3.0",
        },
        beta: {
          react: "npm:19.0.0",
        },
      };

      const resolved = inheritanceService.resolveAllGroups(catalogs);

      expect(resolved).toEqual({
        stable: {
          react: "npm:18.0.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary": {
          react: "npm:18.2.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.1.0",
        },
        "stable/canary/next": {
          react: "npm:18.2.0",
          lodash: "npm:4.17.21",
          typescript: "npm:5.3.0",
        },
        beta: {
          react: "npm:19.0.0",
        },
      });
    });

    it("should return empty object for empty input", () => {
      const resolved = inheritanceService.resolveAllGroups({});
      expect(resolved).toEqual({});
    });
  });
});
