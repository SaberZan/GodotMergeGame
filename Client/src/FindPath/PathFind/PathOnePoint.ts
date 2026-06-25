import { Vector2, Vector3 } from "godot";


export class PathOnePoint {
    //路点
    public locationPos: Vector3 | Vector2 = Vector3.ZERO;

    //路点类型
    public mapNodeType: number = 0;
}