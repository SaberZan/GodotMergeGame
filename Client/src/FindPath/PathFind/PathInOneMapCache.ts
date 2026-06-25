import { Node2D, Node3D, Vector2, Vector3 } from "godot";
import { MapNode } from "../AStar/MapNode";
import { FindPathMap } from "./FindPathMap";
import { PathInOneMap } from "./PathInOneMap";

export class PathInOneMapCache {
    public everyTimeRefreshTag: boolean = false;

    public caches: { [key: number]: PathInOneMap } = {};

    public constructor(everyTimeRefreshTag: boolean = false) {
        this.everyTimeRefreshTag = everyTimeRefreshTag;
    }

    public IsHadPath(mapNodeTypes: number): boolean {
        return this.caches[mapNodeTypes] != undefined && this.caches[mapNodeTypes] != null;
    }

    public GetPath(mapNodeTypes: number): PathInOneMap {
        return this.caches[mapNodeTypes];
    }

    public ChangePath(mapNodeTypes: number, pathInOneMap: PathInOneMap | undefined) {
        if(pathInOneMap) {
            this.caches[mapNodeTypes] = pathInOneMap;
        }else{
            delete this.caches[mapNodeTypes]
        }
        
    }

    public CheckPathOk(findPathMap: FindPathMap, mapNodeTypes: number) {
        if (this.caches[mapNodeTypes] != undefined && this.caches[mapNodeTypes] != null) {
            if (this.everyTimeRefreshTag) {
                delete this.caches[mapNodeTypes];
                return;
            }

            let isPathOk: boolean = true;
            let pathInOneMap: PathInOneMap = this.caches[mapNodeTypes];
            for (let i: number = 0; i < pathInOneMap.pathOnePoints.length; ++i) {
                if(pathInOneMap.root as Node3D) {
                    let v3 = Vector3.ADD((pathInOneMap.root as Node3D).position, pathInOneMap.pathOnePoints[i].locationPos as Vector3);
                    let mapNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(v3);
                    if (!mapNode || mapNode.IsObstacle(mapNodeTypes)) {
                        isPathOk = false;
                        break;
                    } 
                } else if(pathInOneMap.root as Node2D) {
                    let v2 = Vector2.ADD((pathInOneMap.root as Node2D).position, pathInOneMap.pathOnePoints[i].locationPos as Vector2);
                    let mapNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(v2);
                    if (!mapNode || mapNode.IsObstacle(mapNodeTypes)) {
                        isPathOk = false;
                        break;
                    } 
                }
            }
            if (!isPathOk)
                delete this.caches[mapNodeTypes];
        }
    }
}