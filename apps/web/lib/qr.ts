/**
 * Minimal QR encoder: byte mode, error correction level L, versions 1-13.
 * Returns the module matrix so the ticket credential can be scanned by any
 * standard reader instead of being drawn as decoration.
 */

type BlockSpec = { ecPerBlock: number; groups: Array<[number, number]> };

const BLOCK_SPECS: Record<number, BlockSpec> = {
  1: { ecPerBlock: 7, groups: [[1, 19]] },
  2: { ecPerBlock: 10, groups: [[1, 34]] },
  3: { ecPerBlock: 15, groups: [[1, 55]] },
  4: { ecPerBlock: 20, groups: [[1, 80]] },
  5: { ecPerBlock: 26, groups: [[1, 108]] },
  6: { ecPerBlock: 18, groups: [[2, 68]] },
  7: { ecPerBlock: 20, groups: [[2, 78]] },
  8: { ecPerBlock: 24, groups: [[2, 97]] },
  9: { ecPerBlock: 30, groups: [[2, 116]] },
  10: { ecPerBlock: 18, groups: [[2, 68], [2, 69]] },
  11: { ecPerBlock: 20, groups: [[4, 81]] },
  12: { ecPerBlock: 24, groups: [[2, 92], [2, 93]] },
  13: { ecPerBlock: 26, groups: [[4, 107]] },
};

const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
};

const MAX_VERSION = 13;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i += 1) {
    EXP[i] = EXP[i - 255];
  }
})();

function gfMul(a: number, b: number) {
  if (a === 0 || b === 0) {
    return 0;
  }
  return EXP[LOG[a] + LOG[b]];
}

function generatorPoly(degree: number) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function errorCorrection(data: number[], ecLength: number) {
  const generator = generatorPoly(ecLength);
  const remainder = new Array<number>(ecLength).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecLength; i += 1) {
        remainder[i] ^= gfMul(generator[i + 1], factor);
      }
    }
  }

  return remainder;
}

function dataCapacityBits(version: number) {
  const spec = BLOCK_SPECS[version];
  const dataCodewords = spec.groups.reduce(
    (total, [count, size]) => total + count * size,
    0,
  );
  return dataCodewords * 8;
}

function pickVersion(byteLength: number) {
  for (let version = 1; version <= MAX_VERSION; version += 1) {
    const countBits = version < 10 ? 8 : 16;
    const needed = 4 + countBits + byteLength * 8;
    if (needed <= dataCapacityBits(version)) {
      return version;
    }
  }
  return null;
}

function remainderBits(version: number) {
  if (version >= 2 && version <= 6) {
    return 7;
  }
  return 0;
}

function buildCodewords(bytes: number[], version: number) {
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((value >> i) & 1);
    }
  };

  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) {
    push(byte, 8);
  }

  const capacity = dataCapacityBits(version);
  for (let i = 0; i < 4 && bits.length < capacity; i += 1) {
    bits.push(0);
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | bits[i + j];
    }
    codewords.push(byte);
  }

  const pad = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length * 8 < capacity) {
    codewords.push(pad[padIndex % 2]);
    padIndex += 1;
  }

  return codewords;
}

function interleave(codewords: number[], version: number) {
  const spec = BLOCK_SPECS[version];
  const dataBlocks: number[][] = [];
  let cursor = 0;

  for (const [count, size] of spec.groups) {
    for (let i = 0; i < count; i += 1) {
      dataBlocks.push(codewords.slice(cursor, cursor + size));
      cursor += size;
    }
  }

  const ecBlocks = dataBlocks.map((block) =>
    errorCorrection(block, spec.ecPerBlock),
  );

  const result: number[] = [];
  const maxDataLength = Math.max(...dataBlocks.map((block) => block.length));
  for (let i = 0; i < maxDataLength; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (const block of ecBlocks) {
      result.push(block[i]);
    }
  }

  return result;
}

type Matrix = Array<Int8Array>;

function emptyMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => new Int8Array(size).fill(-1));
}

function placeFinder(matrix: Matrix, reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || x < 0 || y >= matrix.length || x >= matrix.length) {
        continue;
      }
      const inRing =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[y][x] = inRing || inCore ? 1 : 0;
      reserved[y][x] = true;
    }
  }
}

function placeAlignment(matrix: Matrix, reserved: boolean[][], version: number) {
  const centers = ALIGNMENT_CENTERS[version];
  const first = centers[0];
  const last = centers[centers.length - 1];
  for (const row of centers) {
    for (const col of centers) {
      const overlapsFinder =
        (row === first && col === first) ||
        (row === first && col === last) ||
        (row === last && col === first);
      if (overlapsFinder) {
        continue;
      }
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const isDark =
            Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0;
          matrix[row + r][col + c] = isDark;
          reserved[row + r][col + c] = true;
        }
      }
    }
  }
}

function bchFormat(value: number) {
  let bits = value << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((bits >> i) & 1) {
      bits ^= 0b10100110111 << (i - 10);
    }
  }
  return ((value << 10) | bits) ^ 0b101010000010010;
}

function bchVersion(version: number) {
  let bits = version << 12;
  for (let i = 17; i >= 12; i -= 1) {
    if ((bits >> i) & 1) {
      bits ^= 0b1111100100101 << (i - 12);
    }
  }
  return (version << 12) | bits;
}

function reserveFormatAreas(reserved: boolean[][], size: number) {
  for (let i = 0; i < 9; i += 1) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
}

function writeFormat(matrix: Matrix, size: number, mask: number) {
  const bits = bchFormat((0b01 << 3) | mask);
  const bitAt = (index: number) => (bits >> index) & 1;

  for (let i = 0; i <= 5; i += 1) {
    matrix[8][i] = bitAt(i);
  }
  matrix[8][7] = bitAt(6);
  matrix[8][8] = bitAt(7);
  matrix[7][8] = bitAt(8);
  for (let i = 9; i < 15; i += 1) {
    matrix[14 - i][8] = bitAt(i);
  }

  for (let i = 0; i < 8; i += 1) {
    matrix[size - 1 - i][8] = bitAt(i);
  }
  for (let i = 8; i < 15; i += 1) {
    matrix[8][size - 15 + i] = bitAt(i);
  }

  matrix[size - 8][8] = 1;
}

function writeVersion(matrix: Matrix, size: number, version: number) {
  if (version < 7) {
    return;
  }
  const bits = bchVersion(version);
  for (let i = 0; i < 18; i += 1) {
    const bit = (bits >> i) & 1;
    const row = Math.floor(i / 3);
    const col = size - 11 + (i % 3);
    matrix[row][col] = bit;
    matrix[col][row] = bit;
  }
}

function maskBit(mask: number, row: number, col: number) {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

function penalty(matrix: Matrix) {
  const size = matrix.length;
  let score = 0;

  const runScore = (line: number[]) => {
    let total = 0;
    let runLength = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === line[i - 1]) {
        runLength += 1;
      } else {
        if (runLength >= 5) {
          total += 3 + (runLength - 5);
        }
        runLength = 1;
      }
    }
    if (runLength >= 5) {
      total += 3 + (runLength - 5);
    }
    return total;
  };

  for (let i = 0; i < size; i += 1) {
    const row: number[] = [];
    const col: number[] = [];
    for (let j = 0; j < size; j += 1) {
      row.push(matrix[i][j]);
      col.push(matrix[j][i]);
    }
    score += runScore(row) + runScore(col);
  }

  for (let i = 0; i < size - 1; i += 1) {
    for (let j = 0; j < size - 1; j += 1) {
      const value = matrix[i][j];
      if (
        value === matrix[i][j + 1] &&
        value === matrix[i + 1][j] &&
        value === matrix[i + 1][j + 1]
      ) {
        score += 3;
      }
    }
  }

  const patternA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const patternB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (line: number[], start: number, pattern: number[]) =>
    pattern.every((bit, offset) => line[start + offset] === bit);

  for (let i = 0; i < size; i += 1) {
    const row: number[] = [];
    const col: number[] = [];
    for (let j = 0; j < size; j += 1) {
      row.push(matrix[i][j]);
      col.push(matrix[j][i]);
    }
    for (let j = 0; j <= size - 11; j += 1) {
      if (matches(row, j, patternA) || matches(row, j, patternB)) {
        score += 40;
      }
      if (matches(col, j, patternA) || matches(col, j, patternB)) {
        score += 40;
      }
    }
  }

  let dark = 0;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      dark += matrix[i][j];
    }
  }
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

export function encodeQr(text: string): boolean[][] | null {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length);
  if (!version) {
    return null;
  }

  const codewords = interleave(buildCodewords(bytes, version), version);
  const size = version * 4 + 17;
  const base = emptyMatrix(size);
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  placeFinder(base, reserved, 0, 0);
  placeFinder(base, reserved, 0, size - 7);
  placeFinder(base, reserved, size - 7, 0);

  for (let i = 8; i < size - 8; i += 1) {
    const bit = i % 2 === 0 ? 1 : 0;
    base[6][i] = bit;
    base[i][6] = bit;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  placeAlignment(base, reserved, version);
  reserveFormatAreas(reserved, size);

  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }

  const bitStream: number[] = [];
  for (const codeword of codewords) {
    for (let i = 7; i >= 0; i -= 1) {
      bitStream.push((codeword >> i) & 1);
    }
  }
  for (let i = 0; i < remainderBits(version); i += 1) {
    bitStream.push(0);
  }

  let index = 0;
  let upward = true;
  let col = size - 1;
  while (col > 0) {
    if (col === 6) {
      col -= 1;
    }
    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (const current of [col, col - 1]) {
        if (reserved[row][current]) {
          continue;
        }
        base[row][current] = index < bitStream.length ? bitStream[index] : 0;
        index += 1;
      }
    }
    upward = !upward;
    col -= 2;
  }

  let best: { matrix: Matrix; score: number } | null = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = base.map((row) => Int8Array.from(row));
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!reserved[row][col] && maskBit(mask, row, col)) {
          candidate[row][col] ^= 1;
        }
      }
    }
    writeFormat(candidate, size, mask);
    writeVersion(candidate, size, version);
    const score = penalty(candidate);
    if (!best || score < best.score) {
      best = { matrix: candidate, score };
    }
  }

  return best!.matrix.map((row) => Array.from(row, (value) => value === 1));
}
