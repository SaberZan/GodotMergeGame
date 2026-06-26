import { AStarMap } from "../AStar/AStarMap";
import { MapNode } from "../AStar/MapNode";
import { LoggerMgr } from "../../Logger/LoggerMgr";
import { PathOnePoint } from "./PathOnePoint";
import { Node, Node2D, Node3D, Vector2, Vector3 } from "godot";

export class FindPathMapInitParams {
    maxX: number = 0;
    maxY: number = 0;
    defautMapNodeType: number = 0;
    eightDir: boolean = false;
    root: Node2D | Node3D | undefined;
    offset: Vector2 | Vector3 = Vector3.ZERO;
    minHeight: number = 0;
    maxHeight: number = 0;
    actualGap: number = 0;
}

export class FindPathMap {
    /**
     * 地图的所在的节点
     */
    public root: Node2D | Node3D | undefined;

    /**
     * A*地图相对于root节点的偏移量
     */
    public offset: Vector3 | Vector2;

    /**
     * 地图最低高度
     */
    public minHeight: number;

    /**
     * 地图最大高度
     */
    public maxHeight: number;

    /**
     * 地图间隔
     */
    public actualGap: number;

    /**
     * A*地图
     */
    public aStarMap: AStarMap;


    constructor(params: FindPathMapInitParams) {
        this.aStarMap = new AStarMap(params.maxX, params.maxY, params.defautMapNodeType, params.eightDir);
        this.root = params.root;
        this.offset = params.offset;
        this.minHeight = params.minHeight;
        this.maxHeight = params.maxHeight;
        this.actualGap = params.actualGap;
    }


    /**
     * 
     * @param worldPos 
     * @returns 
     */
    public IsOwn(worldPos: Vector3 | Vector2): boolean {
        let mapNode = this.GetMapNodeByWorldPos(worldPos);
        return mapNode != null;
    }

    /**
     * 获得地图的世界坐标
     */
    public GetMapWorldPos(): Vector3 | Vector2 {
        if(this.root) {
            if( this.root as Node3D && this.offset as Vector3) {
                return (this.root as Node3D).to_global(this.offset as Vector3);
            } else if( this.root as Node2D && this.offset as Vector2) {
                return (this.root as Node2D).to_global(this.offset as Vector2);
            }   
        }
        return Vector3.ZERO;
    }

    /**
     * 通过地图节点获得世界坐标
     * @param mapNode 
     */
    public GetWorldPos(mapNode: MapNode): Vector3 | Vector2 {
        if( this.root as Node3D && this.offset as Vector3) {
            let v3 = Vector3.ADD(this.offset as Vector3 , new Vector3(mapNode.x * this.actualGap, 0, mapNode.y * this.actualGap))
            return (this.root as Node3D).to_global(v3);
        } else if( this.root as Node2D && this.offset as Vector2) {
            let v2 = Vector2.ADD(this.offset as Vector2 , new Vector2(mapNode.x * this.actualGap, mapNode.y * this.actualGap))
            return (this.root as Node2D).to_global(v2);
        }   
        return Vector3.ZERO;
    }

    /**
     * 通过世界坐标得到地图节点
     * @param worldPos 
     * @returns 
     */
    public GetMapNodeByWorldPos(worldPos: Vector3 | Vector2): MapNode | undefined {
        let mapNode : MapNode | undefined;
        if(this.root) {
            if( this.root as Node3D && worldPos as Vector3) {
                worldPos = (this.root as Node3D).to_local(worldPos as Vector3);
                worldPos = Vector3.SUBTRACT(worldPos, this.offset as Vector3);
                if (worldPos.y > this.minHeight || worldPos.y < this.maxHeight) {
                    let x = Math.round(worldPos.x / this.actualGap);
                    let y = Math.round(worldPos.z / this.actualGap);
                    mapNode = this.GetMapNode(x, y);
                }
            } else if( this.root as Node2D && worldPos as Vector2) {
                worldPos = (this.root as Node2D).to_local(worldPos as Vector2);
                worldPos = Vector2.SUBTRACT(worldPos, this.offset as Vector2);
                if (worldPos.y > this.minHeight || worldPos.y < this.maxHeight) {
                    let x = Math.round(worldPos.x / this.actualGap);
                    let y = Math.round(worldPos.y / this.actualGap);
                    mapNode = this.GetMapNode(x, y);
                }
            }  
        }
        return mapNode;
    }

    /**
     * 通过世界坐标得到地图节点
     * @param worldPos 
     * @returns 
     */
    public GetMapNode(x: number, y: number): MapNode | undefined {
        return this.aStarMap.GetMapNode(x, y);
    }

    /**
     * 通过地图节点获得路点
     * @param mapNode 
     * @returns 
     */
    public GetPathOnePoint(mapNode: MapNode): PathOnePoint {
        let pathOnePoint = new PathOnePoint();
        if( this.root as Node3D && this.offset as Vector3) {
            pathOnePoint.locationPos = Vector3.ADD(new Vector3(mapNode.x * this.actualGap, 0, mapNode.y * this.actualGap), this.offset as Vector3);
        } else if( this.root as Node2D && this.offset as Vector2) {
            pathOnePoint.locationPos = Vector2.ADD(new Vector2(mapNode.x * this.actualGap, mapNode.y * this.actualGap), this.offset as Vector2);
        }   
        pathOnePoint.mapNodeType = mapNode.mapNodeType;
        return pathOnePoint;
    }
}