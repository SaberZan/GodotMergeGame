import { PathCrossTwoMap } from "./PathCrossTwoMap";

export class PathCrossTwoMapCache {
    public caches: { [key: number]: PathCrossTwoMap } = {};

    public IsHadPath(mapNodeTypes: number): boolean {
        return this.caches[mapNodeTypes] != undefined && this.caches[mapNodeTypes] != null;
    }

    public ChangePath(mapNodeTypes: number, pathCrossTwoMap: PathCrossTwoMap) {
        this.caches[mapNodeTypes] = pathCrossTwoMap;
    }

    public GetPath(mapNodeTypes: number): PathCrossTwoMap {
        return this.caches[mapNodeTypes];
    }
}