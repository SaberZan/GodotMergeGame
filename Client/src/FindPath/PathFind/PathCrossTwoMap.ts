import { Node2D, Node3D, Vector2, Vector3 } from "godot";
import { PathOnePoint } from "./PathOnePoint";

export class PathCrossTwoMap {

    public pathOnePoints: PathOnePoint[] = [];

    public root: Node2D | Node3D | undefined;

    /**
     * 如果是传送点，距离要重载
     * @returns 
     */
    public GetPassDis(): number {
        if( this.root as Node3D) {
            return (this.pathOnePoints[0].locationPos as Vector3).distance_to(this.pathOnePoints[this.pathOnePoints.length - 1].locationPos as Vector3);
        } else if( this.root as Node2D) {
            return (this.pathOnePoints[0].locationPos as Vector2).distance_to(this.pathOnePoints[this.pathOnePoints.length - 1].locationPos as Vector2);
        } 
        return Number.MAX_SAFE_INTEGER
    }
}