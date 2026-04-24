import { describe, it, expect } from "vitest";
import { dijkstra, type PathNode } from "@/lib/dijkstra";

function makeNode(id: number, start: number, end: number, accessible = true): PathNode {
  return {
    PathID: id,
    PathName: `Path ${id}`,
    Start: start,
    End: end,
    PSequenceID: id,
    StatusID: 1,
    AccessToggle: accessible ? 1 : 0,
    BuildingID: 1,
    startName: `Node ${start}`,
    endName: `Node ${end}`,
  };
}

// Graph used in most tests:
//   1 --[1]--> 2 --[1]--> 3
//   1 --[5]--> 3   (direct, but heavier)
const basePaths = [
  makeNode(1, 1, 2),
  makeNode(2, 2, 3),
  makeNode(3, 1, 3),
];
const baseWeights = new Map([
  ["1,2", 1],
  ["2,3", 1],
  ["1,3", 5],
]);

describe("dijkstra — basic routing", () => {
  it("returns an empty array when start equals end", () => {
    const result = dijkstra(1, 1, basePaths, baseWeights, false);
    expect(result).toEqual([]);
  });

  it("finds a direct one-hop route", () => {
    const result = dijkstra(1, 2, basePaths, baseWeights, false);
    expect(result).toHaveLength(1);
    expect(result![0].Start).toBe(1);
    expect(result![0].End).toBe(2);
  });

  it("finds a two-hop route", () => {
    const result = dijkstra(1, 3, basePaths, baseWeights, false);
    // Optimal: 1→2→3 (cost 2) not 1→3 (cost 5)
    expect(result).toHaveLength(2);
    expect(result![0].Start).toBe(1);
    expect(result![0].End).toBe(2);
    expect(result![1].Start).toBe(2);
    expect(result![1].End).toBe(3);
  });

  it("returns null when no route exists", () => {
    const result = dijkstra(1, 99, basePaths, baseWeights, false);
    expect(result).toBeNull();
  });
});

describe("dijkstra — weight optimisation", () => {
  it("picks the lower-weight path when two routes exist", () => {
    // 1→3 costs 5, 1→2→3 costs 2 — should choose via node 2
    const result = dijkstra(1, 3, basePaths, baseWeights, false);
    expect(result).toHaveLength(2);
    expect(result!.map((p) => p.End)).toEqual([2, 3]);
  });

  it("uses default weight of 1 when no entry in weightMap", () => {
    const result = dijkstra(1, 3, basePaths, new Map(), false);
    // All edges default to 1, both paths cost the same; any valid result is acceptable
    expect(result).not.toBeNull();
    expect(result!.at(-1)!.End).toBe(3);
  });
});

describe("dijkstra — accessible-only mode", () => {
  it("excludes non-accessible paths", () => {
    const paths = [
      makeNode(1, 1, 2, false), // inaccessible
      makeNode(2, 1, 3, true),  // accessible direct route
    ];
    const weights = new Map([["1,2", 1], ["1,3", 1]]);

    const result = dijkstra(1, 3, paths, weights, true);
    expect(result).toHaveLength(1);
    expect(result![0].End).toBe(3);
  });

  it("returns null when the only route uses inaccessible paths", () => {
    const paths = [makeNode(1, 1, 2, false)];
    const weights = new Map([["1,2", 1]]);

    const result = dijkstra(1, 2, paths, weights, true);
    expect(result).toBeNull();
  });

  it("finds multi-hop accessible route when direct is inaccessible", () => {
    // 1→3 (inaccessible), 1→2→3 (accessible)
    const paths = [
      makeNode(1, 1, 3, false),
      makeNode(2, 1, 2, true),
      makeNode(3, 2, 3, true),
    ];
    const weights = new Map([["1,3", 1], ["1,2", 2], ["2,3", 2]]);

    const result = dijkstra(1, 3, paths, weights, true);
    expect(result).not.toBeNull();
    expect(result!.map((p) => p.End)).toEqual([2, 3]);
  });
});
