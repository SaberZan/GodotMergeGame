import { MapNode } from "./MapNode";

export class AStarMap {
    /**
     * 地图上最大的X
     */
    public maxX: number;

    /**
     * 地图上最大的X
     */
    public maxY: number;

    /**
     * 地图点集合
     */
    public mapNodes: { [key: number]: MapNode };

    /**
     * 是否8方向
     */
    public eightDir: boolean;

    /**
     * 间隔，生成MapNode 的 key用
     */
    private interval: number;


    public constructor(maxX: number, maxY: number, defautMapNodeType: number, eightDir: boolean = true) {
        this.maxX = maxX;
        this.maxY = maxY;
        this.eightDir = eightDir;
        this.interval = 1 << Math.max(this.maxX, this.maxY);
        this.mapNodes = {};

        for (let y: number = 0; y < this.maxY; ++y) {
            for (let x: number = 0; x < this.maxX; ++x) {
                let mapNode: MapNode = new MapNode(x, y, defautMapNodeType, x * this.interval + y);
                this.mapNodes[mapNode.key] = mapNode;
            }
        }
    }

    public Refresh() {
        for (let key in this.mapNodes) {
            this.mapNodes[key].Clear();
        }
    }

    public ChangeMapNodeType(x: number, y: number, mapNodeType: number) {
        if (this.IsInMap(x, y)) {
            let key = x * this.interval + y;
            if (this.mapNodes[key] == undefined) {
                this.mapNodes[key] = new MapNode(x, y, mapNodeType, key);
            }
            else {
                this.mapNodes[key].mapNodeType = mapNodeType;
            }
        }
    }

    public IsInMap(x: number, y: number): boolean {
        return x >= 0 && x <= this.maxX && y >= 0 && y <= this.maxY;
    }

    public IsReachable(x: number, y: number, mapNodeTypes: number): boolean {
        if (this.IsInMap(x, y)) {
            let key = x * this.interval + y;
            return this.mapNodes[key].IsReachable(mapNodeTypes);
        }
        return false;
    }

    public GetMaxSize(): { x: number, y: number } {
        return { x: this.maxX, y: this.maxY };
    }

    public GetCenterPoint(): { x: number, y: number } {
        return { x: this.maxX / 2, y: this.maxY / 2 };
    }

    public GetMapNode(x: number, y: number): MapNode | undefined {
        let key = x * this.interval + y;
        if (this.IsInMap(x, y) && this.mapNodes[key] != undefined) {
            return this.mapNodes[key];
        }
        return undefined;
    }

    /// <summary>
    /// 获取相邻的链接节点信息对象
    /// </summary>
    /// <param name="point">目标点</param>
    /// <returns>节点信息对象</returns>
    public GetLinkPoints(x: number, y: number, mapNodeTypes: number, step: number = 1): MapNode[] {
        let links: MapNode[] = [];
        for (let i: number = -1 * step; i <= 1 * step; i++) {
            for (let j: number = -1 * step; j <= step; j++) {
                if (this.eightDir) {
                    if ((i != 0 || j != 0)) {
                        let mapNode: MapNode | undefined = this.GetMapNode(x + i, y + j);
                        if (mapNode != undefined && mapNode.IsReachable(mapNodeTypes)) {
                            links.push(mapNode);
                        }
                    }
                }
                else {
                    if ((i != 0 && j == 0) || (i == 0 && j != 0)) {
                        let mapNode: MapNode | undefined = this.GetMapNode(x + i, y + j);
                        if (mapNode != undefined && mapNode.IsReachable(mapNodeTypes)) {
                            links.push(mapNode);
                        }
                    }
                }
            }
        }
        return links;
    }

}
