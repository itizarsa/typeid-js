import { describe, expect, it } from "@jest/globals";

import {
  typeidUnboxed,
  parseTypeId,
  toUUID,
  fromUUID,
  fromString,
  getType,
  fromUUIDBytes,
  getSuffix,
} from "../src/unboxed/typeid";
import validJson from "./valid";
import invalidJson from "./invalid";
import {
  InvalidPrefixError,
  InvalidSuffixCharacterError,
  InvalidSuffixLengthError,
  PrefixMismatchError,
} from "../src/unboxed/error";

describe("TypeId Functions", () => {
  describe("typeidUnboxed", () => {
    it("should create a TypeId string", () => {
      const prefix = "test";
      const suffix = "00041061050r3gg28a1c60t3gf";

      const id = typeidUnboxed(prefix, suffix);
      expect(typeof id).toBe("string");
      const { prefix: idPrefix, suffix: idSuffix } = parseTypeId(id);
      expect(idPrefix).toEqual(prefix);
      expect(idSuffix).toEqual(suffix);
    });

    it("should generate a suffix when none is provided", () => {
      const prefix = "test";

      const id = typeidUnboxed(prefix);
      expect(typeof id).toBe("string");
      const { suffix: idSuffix } = parseTypeId(id);
      expect(idSuffix).toHaveLength(26);
    });

    it("should throw an error if prefix is not lowercase", () => {
      expect(() => {
        typeidUnboxed("TEST", "00041061050r3gg28a1c60t3gf");
      }).toThrowError(new InvalidPrefixError("TEST"));

      expect(() => {
        typeidUnboxed("  ", "00041061050r3gg28a1c60t3gf");
      }).toThrowError(new InvalidPrefixError("  "));
    });

    it("should throw an error if suffix length is not 26", () => {
      expect(() => {
        typeidUnboxed("test", "abc");
      }).toThrowError(
        "Invalid length. Suffix should have 26 characters, got 3"
      );
    });
  });

  describe("parseTypeId", () => {
    it("should parse TypeId from a string without prefix", () => {
      const str = "00041061050r3gg28a1c60t3gf";
      const { prefix, suffix } = parseTypeId(fromString(str));

      expect(suffix).toBe(str);
      expect(prefix).toBe("");
    });

    it("should parse TypeId from a string with prefix", () => {
      const str = "prefix_00041061050r3gg28a1c60t3gf";
      const { prefix, suffix } = parseTypeId(fromString(str));

      expect(suffix).toBe("00041061050r3gg28a1c60t3gf");
      expect(prefix).toBe("prefix");
    });

    it("should throw an error for invalid TypeId string", () => {
      const invalidStr = "invalid_string_with_underscore0000000000000000";

      expect(() => {
        fromString(invalidStr);
      }).toThrowError(new InvalidSuffixCharacterError("u"));
    });

    it("should throw an error for empty TypeId string", () => {
      const invalidStr = "";

      expect(() => {
        fromString(invalidStr);
      }).toThrowError(new InvalidSuffixLengthError(0));
    });

    it("should throw an error for TypeId string with empty suffix", () => {
      const invalidStr = "prefix_";

      expect(() => {
        fromString(invalidStr);
      }).toThrowError(new InvalidSuffixLengthError(0));
    });

    it("should throw an error for TypeId string with prefix when there should be none", () => {
      const prefix = "prefix";
      const str = `${prefix}_00041061050r3gg28a1c60t3gf`;

      expect(() => {
        fromString(str);
      }).toThrowError(new PrefixMismatchError("NONE", prefix));
    });
  });

  describe("fromUUIDBytes", () => {
    it("should construct TypeId from a UUID bytes without prefix", () => {
      const bytes = new Uint8Array([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      ]);
      const tid = fromUUIDBytes("", bytes);

      expect(getSuffix(tid)).toBe("00041061050r3gg28a1c60t3gf");
      expect(getType(tid)).toBe("");
    });

    it("should construct TypeID from a UUID bytes with prefix", () => {
      const bytes = new Uint8Array([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
      ]);
      const tid = fromUUIDBytes("prefix", bytes);

      expect(getSuffix(tid)).toBe("00041061050r3gg28a1c60t3gf");
      expect(getType(tid)).toBe("prefix");
    });
  });

  describe("fromUUID", () => {
    it("should construct TypeId from a UUID string without prefix", () => {
      const uuid = "01889c89-df6b-7f1c-a388-91396ec314bc";
      const id = fromUUID(uuid);
      expect(typeof id).toBe("string");
      expect(toUUID(id)).toBe(uuid);
    });

    it("should construct TypeId from a UUID string with prefix", () => {
      const uuid = "01889c89-df6b-7f1c-a388-91396ec314bc";
      const id = fromUUID(uuid, "prefix");
      expect(typeof id).toBe("string");
      expect(getType(id)).toBe("prefix");
      expect(toUUID(id)).toBe(uuid);
    });
  });

  describe("spec", () => {
    validJson.forEach((testcase) => {
      it(`parses string from valid case: ${testcase.name}`, () => {
        const tid = fromString(testcase.typeid, testcase.prefix);
        expect(getType(tid)).toBe(testcase.prefix);
        expect(tid.toString()).toBe(testcase.typeid);
        expect(toUUID(tid)).toBe(testcase.uuid);
      });

      it(`encodes uuid from valid case: ${testcase.name}`, () => {
        const tid = fromUUID(testcase.uuid, testcase.prefix);
        expect(getType(tid)).toBe(testcase.prefix);
        expect(tid.toString()).toBe(testcase.typeid);
        expect(toUUID(tid)).toBe(testcase.uuid);
      });
    });

    invalidJson.forEach((testcase: { name: string; typeid: string }) => {
      it(`errors on invalid case: ${testcase.name}`, () => {
        expect(() => {
          fromString(testcase.typeid);
        }).toThrowError();
      });
    });
  });
});
