import { MapPoint } from "./MapPoint";

export class MapNode extends MapPoint {
    public key: number;

    public g: number = 0;

    public h: number = 0;

    public get f(): number {
        return this.g + this.h;
    };

    public parent: MapNode | undefined;

    public mapNodeType: number;

    public constructor(x: number, y: number, mapNodeType: number, key: number) {
        super(x, y);
        this.mapNodeType = mapNodeType;
        this.key = key;
    }

    public IsContain(mapNodeTypes: number): boolean {
        return this.mapNodeType == (mapNodeTypes & this.mapNodeType);
    }

    public IsReachable(mapNodeTypes: number): boolean {
        return this.mapNodeType == (mapNodeTypes & this.mapNodeType);
    }

    public IsObstacle(mapNodeTypes: number): boolean {
        return this.mapNodeType != (mapNodeTypes & this.mapNodeType);
    }
    
    public GetKey(): number {
        return this.key;
    }

    public Clear() {
        this.g = 0;
        this.h = 0;
        this.parent = undefined;
    }
}
