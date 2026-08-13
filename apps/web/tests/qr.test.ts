import { describe, expect, it } from "vitest";
import { encodeQr } from "@/lib/qr";

const JWT_LIKE_CREDENTIAL = [
  "eyJhbGciOiJIUzI1NiIsImtpZCI6InYxIiwidHlwIjoiRVRRUiJ9",
  "eyJ2IjoxLCJ0aWNrZXRfaWQiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJldmVudF9pZCI6ImFhYWFhYWFhLWJiYmItY2NjYy1kZGRkLWVlZWVlZWVlZWVlZSIsIm5vbmNlIjoiZFcxdlpXNXpaWEpsYm5wcGJtY3RibTl1WTJVdGRtRnNkV1UiLCJpYXQiOjE3NzgxNjk2MDB9",
  "0dGhpc2lzYXNpZ25hdHVyZXZhbHVlZm9ydGVzdGluZw",
].join(".");

function finderIsIntact(matrix: boolean[][], rowOffset: number, colOffset: number) {
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const inRing = row === 0 || row === 6 || col === 0 || col === 6;
      const inCore = row >= 2 && row <= 4 && col >= 2 && col <= 4;
      if (matrix[rowOffset + row][colOffset + col] !== (inRing || inCore)) {
        return false;
      }
    }
  }
  return true;
}

describe("qr encoder", () => {
  it("uses the smallest version that fits the payload", () => {
    const matrix = encodeQr("ELITE")!;

    expect(matrix).not.toBeNull();
    expect(matrix.length).toBe(21);
  });

  it("grows the version for a signed ticket credential", () => {
    const matrix = encodeQr(JWT_LIKE_CREDENTIAL)!;

    expect(matrix).not.toBeNull();
    const version = (matrix.length - 17) / 4;
    expect(Number.isInteger(version)).toBe(true);
    expect(version).toBeGreaterThan(1);
    expect(version).toBeLessThanOrEqual(13);
  });

  it("places the three finder patterns", () => {
    const matrix = encodeQr(JWT_LIKE_CREDENTIAL)!;
    const size = matrix.length;

    expect(finderIsIntact(matrix, 0, 0)).toBe(true);
    expect(finderIsIntact(matrix, 0, size - 7)).toBe(true);
    expect(finderIsIntact(matrix, size - 7, 0)).toBe(true);
  });

  it("places alternating timing patterns", () => {
    const matrix = encodeQr(JWT_LIKE_CREDENTIAL)!;

    for (let i = 8; i < matrix.length - 8; i += 1) {
      expect(matrix[6][i]).toBe(i % 2 === 0);
      expect(matrix[i][6]).toBe(i % 2 === 0);
    }
  });

  it("sets the mandatory dark module", () => {
    const matrix = encodeQr("ELITE")!;

    expect(matrix[matrix.length - 8][8]).toBe(true);
  });

  it("writes both copies of the format information consistently", () => {
    const matrix = encodeQr(JWT_LIKE_CREDENTIAL)!;
    const size = matrix.length;

    const firstCopy = [
      ...Array.from({ length: 6 }, (_, i) => matrix[8][i]),
      matrix[8][7],
      matrix[8][8],
      matrix[7][8],
      ...Array.from({ length: 6 }, (_, i) => matrix[14 - (i + 9)][8]),
    ];
    const secondCopy = [
      ...Array.from({ length: 8 }, (_, i) => matrix[size - 1 - i][8]),
      ...Array.from({ length: 7 }, (_, i) => matrix[8][size - 15 + (i + 8)]),
    ];

    expect(firstCopy).toEqual(secondCopy);
  });

  it("is deterministic for the same payload", () => {
    expect(encodeQr(JWT_LIKE_CREDENTIAL)).toEqual(encodeQr(JWT_LIKE_CREDENTIAL));
  });

  it("returns null when the payload exceeds the supported capacity", () => {
    expect(encodeQr("x".repeat(2000))).toBeNull();
  });
});
