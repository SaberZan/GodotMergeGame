import { Node, Node2D, Node3D, Vector2, Vector3 } from "godot";
import { PathOnePoint } from "./PathOnePoint";

export class PathInOneMap {

    public pathOnePoints: PathOnePoint[] = [];

    public root: Node2D | Node3D | undefined;

    /**
     * 需要重载
     * @param index 
     */
    public GetWorldPos(index: number): Vector3 | Vector2 {
        if(this.root as Node3D) {
            return Vector3.ADD((this.root as Node3D).position,this.pathOnePoints[index].locationPos as Vector3);
        } else if(this.root as Node2D) {
            return Vector2.ADD((this.root as Node2D).position,this.pathOnePoints[index].locationPos as Vector2);
        }
        return Vector3.ZERO;
    }
}