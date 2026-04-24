export interface PathNode {
  PathID: number;
  PathName: string;
  Start: number;
  End: number;
  PSequenceID: number;
  StatusID: number;
  AccessToggle: number;
  BuildingID: number;
  startName: string | null;
  endName: string | null;
}

export function dijkstra(
  startId: number,
  endId: number,
  paths: PathNode[],
  weightMap: Map<string, number>,
  accessibleOnly: boolean
): PathNode[] | null {
  if (startId === endId) return [];

  const adj = new Map<number, PathNode[]>();
  for (const p of paths) {
    if (!adj.has(p.Start)) adj.set(p.Start, []);
    adj.get(p.Start)!.push(p);
  }

  const dist = new Map<number, number>([[startId, 0]]);
  const prev = new Map<number, PathNode>();
  const pq: Array<[number, number]> = [[0, startId]];

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [cost, node] = pq.shift()!;

    if (node === endId) break;

    if (cost > (dist.get(node) ?? Infinity)) continue;

    for (const path of adj.get(node) ?? []) {
      if (accessibleOnly && path.AccessToggle !== 1) continue;
      const edgeKey = `${path.Start},${path.End}`;
      const weight = weightMap.get(edgeKey) ?? 1;
      const newCost = cost + weight;

      if (newCost < (dist.get(path.End) ?? Infinity)) {
        dist.set(path.End, newCost);
        prev.set(path.End, path);
        pq.push([newCost, path.End]);
      }
    }
  }

  if (!prev.has(endId)) return null;

  const route: PathNode[] = [];
  let cur = endId;
  while (cur !== startId) {
    const p = prev.get(cur);
    if (!p) return null;
    route.unshift(p);
    cur = p.Start;
  }
  return route;
}
