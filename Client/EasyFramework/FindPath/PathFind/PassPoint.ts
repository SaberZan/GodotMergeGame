import { PathInOneMapCache } from "./PathInOneMapCache";
import { PathInOneMap } from "./PathInOneMap";
import { PathCrossTwoMapCache } from "./PathCrossTwoMapCache";
import { Vector3 } from "godot";

export class PassPoint {
    public ownAStarKey: string;

    public worldPos: Vector3;

    public links: PassPoint[] = []; //同一张地图可联通的传送点 和pass组件相连的点为link点

    public paths: (PathInOneMapCache | PathCrossTwoMapCache)[] = []; //包含 PassComponent 和 PathInOneMap， 可直接取出使用

    public startPath: PathInOneMap | undefined;   //缓存的起点到此Pass点的寻路路径

    public endPath: PathInOneMap | undefined;     //缓存此Pass点到终点到的寻路路径

    //以下寻路算法用
    public parent: PassPoint | undefined;

    public g: number = 0;

    public h: number = 0;

    public get f(): number {
        return this.g + this.h;
    } ;

    constructor(ownAStarKey : string, worldPos : Vector3){
        this.ownAStarKey = ownAStarKey;
        this.worldPos = worldPos;
    }

    public Clear() {
        this.g = 0;
        this.h = 0;
        this.parent = undefined;
    }

}