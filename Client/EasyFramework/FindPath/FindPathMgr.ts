/**
 * 多地图传送点寻路
 */

import { AStar } from "./AStar/AStar";
import { FindPathMap } from "./PathFind/FindPathMap";
import { MapNode } from "./AStar/MapNode";
import { PassPoint } from "./PathFind/PassPoint";
import { PathInOneMapCache } from "./PathFind/PathInOneMapCache";
import { PathInOneMap } from "./PathFind/PathInOneMap";
import { PathCrossTwoMapCache } from "./PathFind/PathCrossTwoMapCache";
import { MapNodeType } from "./PathFind/MapNodeType";
import { PathCrossTwoMap } from "./PathFind/PathCrossTwoMap";
import { Singleton } from "../Utils/Singleton";
import { LoggerMgr } from "../Logger/LoggerMgr";
import { Vector2, Vector3 } from "godot";

export class FindPathMgr extends Singleton<FindPathMgr> {

    public allMaps: { [key: string]: FindPathMap } = {};

    public allPassPoints: PassPoint[] = [];

    public aStar: AStar = new AStar();

    public AddMap(key: string, map: FindPathMap) {
        this.allMaps[key] = map;
    }

    public GetMap(key: string): FindPathMap {
        return this.allMaps[key];
    }

    public FindPath(start: Vector3, end: Vector3, mapNodeTypes: number): (PathInOneMap | PathCrossTwoMap)[] {
        
        let finalPath: (PathInOneMap | PathCrossTwoMap)[] = [];

        let startMapKey: string | undefined = this.GetOwnMapKey(start);
        let endMapKey: string | undefined = this.GetOwnMapKey(end);

        if (startMapKey == null) {//起点在地图外
            LoggerMgr.Instance().Log("起点在地图外");
            return [];
        }

        if (endMapKey == null) {//终点在地图外
            LoggerMgr.Instance().Log("终点在地图外");
            return [];
        }


        if (startMapKey == endMapKey) {//如果在同一张地图，直接寻路得出结果
            let findPathMap: FindPathMap = this.allMaps[startMapKey];
            let startNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(start);
            let endNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(end);

            if (startNode != null && endNode != null) {
                let findPath: MapNode[] = this.aStar.FindPath(findPathMap.aStarMap, startNode, endNode, mapNodeTypes);
                if (findPath.length > 0) { //有路正常走
                    let pathInOneMap: PathInOneMap = new PathInOneMap();
                    pathInOneMap.root = findPathMap.root;
                    for (let i in findPath) {
                        pathInOneMap.pathOnePoints.push(findPathMap.GetPathOnePoint(findPath[i]));
                    }
                    finalPath.push(pathInOneMap);
                } else {                                      //没有路走传送点
                
                    finalPath = this.FindPathWithPassPoints(start, end, mapNodeTypes);
                }
            }
        }
        else                        //非同一张地图,通过传送点算出最优传送点路径
        {
            finalPath = this.FindPathWithPassPoints(start, end, mapNodeTypes);
        }

        return finalPath;
    }

    public FindPathWithPassPoints(start: Vector3, end: Vector3, mapNodeTypes: number): any[] {
        for (let i in this.allPassPoints) {
            let passPoint = this.allPassPoints[i];
            passPoint.g = 0;
            passPoint.h = 0;
            passPoint.parent = undefined;
            passPoint.startPath = undefined;
            passPoint.endPath = undefined;
            for (let i: number = 0; i < passPoint.paths.length; ++i) {
                let findPathMap = this.allMaps[passPoint.ownAStarKey];
                let passPath = passPoint.paths[i];
                if (passPath instanceof PathInOneMapCache) {
                    let pathInOneMapCache: PathInOneMapCache = <PathInOneMapCache>passPath;
                    pathInOneMapCache.CheckPathOk(findPathMap, mapNodeTypes);
                }
            }
        }

        let MaxFind: number = 100;
        let findNum: number = 0;
        let open: PassPoint[] = [];
        let close: PassPoint[] = [];

        let startNode: MapNode | undefined;
        let endNode: MapNode | undefined;

        let startMapKey: string | undefined = this.GetOwnMapKey(start);
        let endMapKey: string | undefined = this.GetOwnMapKey(end);

        for (let i in this.allPassPoints) {
            let passPoint = this.allPassPoints[i];
            if (passPoint.ownAStarKey == startMapKey) {
                let findPathMap = this.allMaps[passPoint.ownAStarKey];
                startNode = findPathMap.GetMapNodeByWorldPos(start);
                endNode = findPathMap.GetMapNodeByWorldPos(passPoint.worldPos);
                if (startNode == undefined ||  endNode == undefined) {
                    break;
                }
                let findPath = this.aStar.FindPath(findPathMap.aStarMap, startNode, endNode, mapNodeTypes, false);
                if (findPath.length > 0) {
                    let pathInOneMap = new PathInOneMap();
                    pathInOneMap.root = findPathMap.root;
                    for (let index in findPath) {
                        pathInOneMap.pathOnePoints.push(findPathMap.GetPathOnePoint(findPath[index]));
                    }
                    passPoint.startPath = pathInOneMap;
                    let v3 = pathInOneMap.GetWorldPos(pathInOneMap.pathOnePoints.length - 1);
                    passPoint.g = this.GetDistance(start, v3);
                    passPoint.h = this.GetDistance(v3, end);
                    open.push(passPoint);
                }
            }
        }
        if (open.length == 0) {
            LoggerMgr.Instance().Log("起点无法到Pass点");
            return [];
        }

        let endPassPoints: PassPoint[] = [];
        for (let i in this.allPassPoints) {
            let passPoint = this.allPassPoints[i];
            if (passPoint.ownAStarKey == endMapKey) {
                let findPathMap = this.allMaps[passPoint.ownAStarKey];
                startNode = findPathMap.GetMapNodeByWorldPos(passPoint.worldPos);
                endNode = findPathMap.GetMapNodeByWorldPos(end);
                if (startNode != undefined &&  endNode != undefined) {
                    let findPath = this.aStar.FindPath(findPathMap.aStarMap, startNode, endNode, mapNodeTypes);
                    if (findPath.length > 0) {
                        let pathInOneMap = new PathInOneMap();
                        pathInOneMap.root = findPathMap.root;
                        for (let index in findPath) {
                            pathInOneMap.pathOnePoints.push(findPathMap.GetPathOnePoint(findPath[i]));
                        }
                        passPoint.endPath = pathInOneMap;
                        endPassPoints.push(passPoint);
                    }
                }
            }
        }
        if (endPassPoints.length == 0) {
            LoggerMgr.Instance().Log("终点无法到Pass点");
            return [];
        }

        let currentPassPoint = null;
        while (true) {
            ++findNum;
            if (findNum >= MaxFind) {
                LoggerMgr.Instance().Log("Pass点找太多次");
                return [];
            }

            currentPassPoint = null;
            for (let i in open) {
                let passPoint = open[i];
                if (currentPassPoint == null) {
                    currentPassPoint = passPoint;
                }
                else if (passPoint.f < currentPassPoint.f) {
                    currentPassPoint = passPoint;
                }
            }

            if (currentPassPoint == null) {
                LoggerMgr.Instance().Log("Pass点无法找到");
                return [];
            }

            if (endPassPoints.indexOf(currentPassPoint) != -1) {
                let path: PassPoint[] = [];
                let tmpPassPoint = currentPassPoint;
                while (tmpPassPoint.parent != null) {
                    path.push(tmpPassPoint);
                    tmpPassPoint = tmpPassPoint.parent;
                }
                path.push(tmpPassPoint);
                path.reverse();
                return this.BuildPathWithPassPoints(path, mapNodeTypes);
            }

            open.splice(0, open.indexOf(currentPassPoint));
            close.push(currentPassPoint);

            for (let i in this.allPassPoints) {
                let passPoint = this.allPassPoints[i];
                let index = passPoint.links.indexOf(currentPassPoint);
                if (index != -1) {
                    if (passPoint.paths[index] instanceof PathInOneMapCache && !(<PathInOneMapCache>passPoint.paths[index]).IsHadPath(mapNodeTypes)) {
                        this.RefreshPassPointPath(passPoint, index, mapNodeTypes);
                    }
                }

                if (index != -1 && close.indexOf(passPoint) == -1) {
                    let newG = currentPassPoint.g;
                    let temp = 0;
                    if (passPoint.paths[index] instanceof PathInOneMapCache) {
                        if (!(<PathInOneMapCache>passPoint.paths[index]).IsHadPath(mapNodeTypes))
                            continue;
                        temp = this.GetDistance(currentPassPoint.worldPos, passPoint.worldPos);
                    }
                    else if (passPoint.paths[index] instanceof PathCrossTwoMapCache) {
                        let pathCrossTwoMapCache = <PathCrossTwoMapCache>passPoint.paths[index];
                        if (!pathCrossTwoMapCache.IsHadPath(mapNodeTypes))
                            continue;

                        temp = pathCrossTwoMapCache.GetPath(mapNodeTypes).GetPassDis();
                    }
                    newG += temp;

                    if (open.indexOf(passPoint) != -1) {
                        if (newG < passPoint.g) {
                            passPoint.g = newG;
                            passPoint.h = this.GetDistance(passPoint.worldPos, end);
                            passPoint.parent = currentPassPoint;
                        }
                    }
                    else {
                        passPoint.g = newG;
                        passPoint.h = this.GetDistance(passPoint.worldPos, end);
                        passPoint.parent = currentPassPoint;
                        open.push(passPoint);
                    }
                }

            }
        }
    }

    public BuildPathWithPassPoints(passPoints: PassPoint[], mapNodeTypes: number): (PathInOneMap | PathCrossTwoMap)[] {
        let finalPath: (PathInOneMap | PathCrossTwoMap)[] = [];
        if (passPoints.length > 0) {
            //进入传送点遍历
            for (let i = 0; i < passPoints.length; ++i) {
                let nowPassPoint = passPoints[i];
                let passPath: PathInOneMap | PathCrossTwoMap | undefined = undefined;
                let start: PathInOneMap | undefined = undefined;
                let end: PathInOneMap | undefined = undefined;
                if (i < passPoints.length - 1) {
                    let nextPassPoint: PassPoint = passPoints[i + 1];
                    let index = nowPassPoint.links.indexOf(nextPassPoint);
                    if (nowPassPoint.paths[index] instanceof PathInOneMapCache) {
                        passPath = (<PathInOneMapCache>nowPassPoint.paths[index]).GetPath(mapNodeTypes);
                    }
                    else if (nowPassPoint.paths[index] instanceof PathCrossTwoMapCache) {
                        passPath = (<PathCrossTwoMapCache>nowPassPoint.paths[index]).GetPath(mapNodeTypes);
                    }
                }

                if (i == 0) {//先到第一个传送点
                    start = nowPassPoint.startPath;
                }
                else if (i == passPoints.length - 1) {//最后一个传送点算出到终点距离
                    end = nowPassPoint.endPath;
                }

                if (start != null) {
                    finalPath.push(start);
                }
                if (passPath != null) {
                    finalPath.push(passPath);
                }
                if (end != null) {
                    finalPath.push(end);
                }
            }
        }
        passPoints = [];
        return finalPath;
    }

    public AddPassPoint(passPoint1: PassPoint, passPoint2: PassPoint, pathCrossTwoMapCache: PathCrossTwoMapCache) {
        passPoint1.links.push(passPoint2);
        passPoint1.paths.push(pathCrossTwoMapCache);
        passPoint2.links.push(passPoint1);
        passPoint2.paths.push(pathCrossTwoMapCache);
        this.RefreshInOnMapPass(passPoint1);
        this.RefreshInOnMapPass(passPoint2);
        this.allPassPoints.push(passPoint1);
        this.allPassPoints.push(passPoint2);
    }

    public RefreshInOnMapPass(passPoint1: PassPoint) {
        for (let i in this.allPassPoints) {
            let passPoint = this.allPassPoints[i];
            if (passPoint.ownAStarKey == passPoint1.ownAStarKey) {
                let findPathMap = this.allMaps[passPoint.ownAStarKey];
                let startNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(passPoint1.worldPos);
                let endNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(passPoint.worldPos);
                //如果陆地和可拆障碍物可以连接视为可连接
                if (startNode && endNode) {
                    let findPath = this.aStar.FindPath(findPathMap.aStarMap, startNode, endNode, MapNodeType.Land | MapNodeType.Water | MapNodeType.Obstacle, false);
                    if (findPath.length > 0) {
                        passPoint1.links.push(passPoint);
                        passPoint.links.push(passPoint1);
                        passPoint1.paths.push(new PathInOneMapCache());
                        passPoint.paths.push(new PathInOneMapCache());
                    }
                }
            }
        }
    }

    private RefreshPassPointPath(passPoint: PassPoint, index: number, mapNodeTypes: number) {
        let nextPassPoint: PassPoint = passPoint.links[index];

        let findPathMap = this.allMaps[passPoint.ownAStarKey];
        let startNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(passPoint.worldPos);
        let endNode: MapNode | undefined = findPathMap.GetMapNodeByWorldPos(nextPassPoint.worldPos);
        if (startNode && endNode) {
            let aStarPath = this.aStar.FindPath(findPathMap.aStarMap, startNode, endNode, mapNodeTypes, false);
            if (aStarPath.length > 0) {
                let pathInOneMap = new PathInOneMap();
                pathInOneMap.root = findPathMap.root;
                for (let i in aStarPath) {
                    pathInOneMap.pathOnePoints.push(findPathMap.GetPathOnePoint(aStarPath[i]));
                }
                let pathInOneMapNext = new PathInOneMap();
                pathInOneMapNext.root = findPathMap.root;
                pathInOneMapNext.pathOnePoints.concat(pathInOneMap.pathOnePoints);
                pathInOneMapNext.pathOnePoints.reverse();
                let tmpIndex = nextPassPoint.links.indexOf(passPoint);
                (<PathInOneMapCache>passPoint.paths[index]).ChangePath(mapNodeTypes, pathInOneMap);
                (<PathInOneMapCache>nextPassPoint.paths[tmpIndex]).ChangePath(mapNodeTypes, pathInOneMapNext);
            }
            else {
                let tmpIndex = nextPassPoint.links.indexOf(passPoint);
                (<PathInOneMapCache>passPoint.paths[index]).ChangePath(mapNodeTypes, undefined);
                (<PathInOneMapCache>nextPassPoint.paths[tmpIndex]).ChangePath(mapNodeTypes, undefined);
            }
        }
    }


    public ChangeMapNodeType(findPathMap: FindPathMap, positions: { x: number, y: number }[], mapNodeType: number) {
        for (let i in positions) {
            findPathMap.aStarMap.ChangeMapNodeType(positions[i].x, positions[i].y, mapNodeType);
        }
    }

    public GetOwnMap(worldPos: any): FindPathMap | undefined {
        for (let key in this.allMaps) {
            if (this.allMaps[key].IsOwn(worldPos)) {
                return this.allMaps[key];
            }
        }
        return undefined;
    }

    public GetOwnMapKey(worldPos: any): string | undefined{
        for (let key in this.allMaps) {
            if (this.allMaps[key].IsOwn(worldPos)) {
                return key;
            }
        }
        return undefined;
    }

    /**
     * 判断两个点的距离花费
     */
    public GetDistance(pos1: Vector3 | Vector2, pos2: Vector3 | Vector2): number {
        if(pos1 as Vector3 && pos2 as Vector3) {
            return (pos1 as Vector3).distance_to(pos2 as Vector3);
        }
        if(pos1 as Vector2 && pos2 as Vector2) {
            return (pos1 as Vector2).distance_to(pos2 as Vector2);
        }
        return Number.MAX_SAFE_INTEGER;
        
    }
}
