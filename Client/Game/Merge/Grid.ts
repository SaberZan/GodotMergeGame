import { Node, Vector2 } from "godot";
import type { MergeManager } from "./MergeManager";
import { Vec2 } from "./MergeTypes";

export class Grid {
    public manager: MergeManager | null = null;
    public transform: Node | null = null;
    public row: number = 0;
    public col: number = 0;
    public isHighLight: boolean = false;
    public position: Vector2 = Vec2();

    public CreateMapView(row: number, col: number): void {
        this.row = row;
        this.col = col;
    }

    public ShowHighLight(): void {
        if (this.isHighLight) {
            return;
        }
        this.isHighLight = true;
    }

    public FadeHighLight(): void {
        if (!this.isHighLight) {
            return;
        }
        this.isHighLight = false;
    }

    public Destroy(): void {
        this.transform = null;
        this.manager = null;
    }
}

