import { Node, Vector3 } from "godot";
import { BaseCom, MergeComConstructor } from "./Components";
import { Vec3, Vector3Like } from "./MergeTypes";

export class MergeUtility {
    private static readonly comsPool: Map<string, BaseCom[]> = new Map<string, BaseCom[]>();

    public static ClearPool(): void {
        this.comsPool.clear();
    }

    public static GetComFromPool<T extends BaseCom>(type: MergeComConstructor<T>): T {
        const key = type.name;
        const queue = this.comsPool.get(key);
        if (queue != null && queue.length > 0) {
            return queue.shift() as T;
        }
        return new type();
    }

    public static PutComToPool<T extends BaseCom>(com: T): void {
        const key = com.constructor.name;
        if (!this.comsPool.has(key)) {
            this.comsPool.set(key, []);
        }
        com.Reset();
        this.comsPool.get(key)?.push(com);
    }

    public static RandomByWeight(weights: Array<[number, number]>): number {
        if (weights.length === 0) {
            return 0;
        }
        const allWeight = weights.reduce((sum, item) => sum + item[1], 0);
        if (allWeight <= 0) {
            return weights[0][0];
        }
        let randValue = Math.floor(Math.random() * allWeight);
        for (const item of weights) {
            randValue -= item[1];
            if (randValue < 0) {
                return item[0];
            }
        }
        return weights[0][0];
    }

    public static GetBazierPath(startPos: Vector3Like, endPos: Vector3Like, isInverse: boolean = false): Vector3[] {
        const pathPos: Vector3[] = [Vec3(startPos.x, startPos.y, startPos.z ?? 0)];
        const dis = Math.sqrt(Math.pow(startPos.x - endPos.x, 2) + Math.pow(startPos.y - endPos.y, 2));
        let midPos = Vec3(
            (startPos.x + endPos.x) / 2 + this.RandomRange(dis / 10, dis / 3),
            (startPos.y + endPos.y) / 2 + this.RandomRange(dis / 10, dis / 3),
            ((startPos.z ?? 0) + (endPos.z ?? 0)) / 2,
        );
        if (isInverse) {
            midPos = Vec3(-midPos.x, -midPos.y, -midPos.z);
        }
        this.GetSecondBezierPath(startPos, midPos, endPos, 40, pathPos);
        return pathPos;
    }

    public static GetSecondBezierPath(startPoint: Vector3Like, controlPoint: Vector3Like, endPoint: Vector3Like, segNum: number, path: Vector3[]): void {
        for (let i = 0; i < segNum; i++) {
            const t = i / segNum;
            path.push(this.GetSecondBezierPos(t, startPoint, controlPoint, endPoint));
        }
    }

    public static ShowEffect(_prefab: Node | null, _parent: Node | null, _position: Vector3Like): Node | null {
        return null;
    }

    public static GetItemGameObject<T extends Node>(_prefab: T | null, _parent: Node | null): T | null {
        return _prefab;
    }

    public static PutItemGameObject(_prefab: Node | null, _node: Node | null): void {
    }

    private static GetSecondBezierPos(t: number, p0: Vector3Like, p1: Vector3Like, p2: Vector3Like): Vector3 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        return Vec3(
            uu * p0.x + 2 * u * t * p1.x + tt * p2.x,
            uu * p0.y + 2 * u * t * p1.y + tt * p2.y,
            uu * (p0.z ?? 0) + 2 * u * t * (p1.z ?? 0) + tt * (p2.z ?? 0),
        );
    }

    private static RandomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}

