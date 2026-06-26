import { Vector2, Vector3 } from "godot";

export type Vector2Like = Vector2 | { x: number; y: number };
export type Vector3Like = Vector3 | { x: number; y: number; z?: number };

export class Vector2Int {
    public static readonly zero: Vector2Int = new Vector2Int(0, 0);

    public x: number;
    public y: number;

    public constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public Equals(other: Vector2Int): boolean {
        return this.x === other.x && this.y === other.y;
    }
}

export function Vec2(x: number = 0, y: number = 0): Vector2 {
    return new Vector2(x, y);
}

export function Vec3(x: number = 0, y: number = 0, z: number = 0): Vector3 {
    return new Vector3(x, y, z);
}

export function Distance2(a: Vector2Like | Vector3Like, b: Vector2Like | Vector3Like): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

