/**
 * A*寻路
 */

import { LoggerMgr } from "../../Logger/LoggerMgr";
import { AStarMap } from "./AStarMap";
import { MapNode } from "./MapNode";

export class AStar {
    /**
     * 最大寻找次数 
     */
    private MaxFind: number = 5000;

    /**
     * 直线花费
     */
    private StraightCost: number = 10;

    /**
     * 
     */
    private ObliqueCost: number = 14;

    private openDic: { [key: number]: MapNode } = {};

    private closeDic: { [key: number]: MapNode } = {};

    private startNode: MapNode | undefined;

    private endNode: MapNode | undefined;

    private endNodes: MapNode[] = [];

    private maxF: number = 0;

    private map: AStarMap | undefined;

    public constructor() {

    }

    public FindPath(aStarMap: AStarMap, start: MapNode, end: MapNode, mapNodeTypes: number, endLinks: boolean = true): MapNode[] {
        this.map = aStarMap;
        this.map.Refresh();
        if (!this.map.IsInMap(start.x, start.y) || !this.map.IsInMap(end.x, end.y)) {
            LoggerMgr.Instance().Log("AStar-- 在地图外");
            return [];
        }

        if (start == end) {
            return [start];
        }

        this.openDic = {};
        this.closeDic = {};
        this.endNodes = [];
        this.startNode = this.map.GetMapNode(start.x, start.y);
        if (this.startNode == null || this.startNode.IsObstacle(mapNodeTypes)) {
            LoggerMgr.Instance().Log("AStar-- 没有起点或者起点不可走" + (this.startNode == null));
            return [];
        }
        this.endNode = this.map.GetMapNode(end.x, end.y);
        if (this.endNode == null) {
            LoggerMgr.Instance().Log("AStar-- 没有终点");
            return [];
        }
        if (this.endNode.IsObstacle(mapNodeTypes)) {
            if (endLinks) {
                this.endNodes = aStarMap.GetLinkPoints(this.endNode.x, this.endNode.y, mapNodeTypes);
            }
        } else {
            this.endNodes.push(this.endNode);
        }
        if (this.endNodes.length == 0) {
            LoggerMgr.Instance().Log("AStar-- 终点不可到达");
            return [];
        }

        let originNode = this.map.GetMapNode(0, 0);
        let farthestNode = this.map.GetMapNode(this.map.maxX - 1, this.map.maxY - 1);
        if (originNode && farthestNode) {
            this.maxF = this.GetManhattanCost(originNode, farthestNode);
        }

        let findNum: number = 0;
        let currentNode: MapNode | undefined = this.startNode;
        this.AddOpenDic(currentNode);

        while (true) {
            ++findNum;
            if (findNum >= this.MaxFind) {
                LoggerMgr.Instance().Log("AStar-- 找太多次了");
                return [];
            }

            currentNode = this.SelectNodeInOpenDic();
            if (currentNode == null) {
                LoggerMgr.Instance().Log("AStar-- 没用路");
                return [];
            }

            if (this.IsEndNode(currentNode)) {
                return this.BuildPath(currentNode);
            }

            this.RemoveFromOpenDic(currentNode);
            this.AddCloseDic(currentNode);

            let links = this.map.GetLinkPoints(currentNode.x, currentNode.y, mapNodeTypes);
            for (let i = 0; i < links.length; ++i) {
                let link: MapNode = links[i];
                if (!this.IsInCloseDic(link)) {
                    let newG: number = currentNode.g;
                    if (link.x == currentNode.x || link.y == currentNode.y) {
                        newG += this.StraightCost * link.mapNodeType;
                    } else {
                        newG += this.ObliqueCost * link.mapNodeType;
                    }

                    if (this.IsInOpenDic(link)) {
                        if (newG < link.g) {
                            link.g = newG;
                            link.h = this.GetManhattanCost(link, this.endNode);
                            link.parent = currentNode;
                        }
                    } else {
                        link.g = newG;
                        link.h = this.GetManhattanCost(link, this.endNode);
                        link.parent = currentNode;
                        this.AddOpenDic(link);
                    }
                }
            }
        }
    }

    public BuildPath(endNode: MapNode): MapNode[] {
        let path: MapNode[] = [];
        let tmpNode = endNode;
        while (tmpNode.parent != null || tmpNode.parent != undefined) {
            path.push(tmpNode);
            tmpNode = tmpNode.parent;
        }
        path.push(tmpNode);
        path = path.reverse();
        return path;
    }

    public SelectNodeInOpenDic(): MapNode | undefined {
        let miniFNode: MapNode | undefined;
        for (let key in this.openDic) {
            let node: MapNode = this.openDic[key];
            // LoggerMgr.Instance(LoggerMgr).Log("node == " + (node == null) + " " + key);
            if (node == null)
                continue;
            if (miniFNode == null) {
                miniFNode = node;
            }
            else if (node.f < miniFNode.f) {
                miniFNode = node;
            }
        }
        return miniFNode;
    }

    public GetManhattanCost(node1: MapNode, node2: MapNode): number {
        let dx: number = Math.abs(node1.x - node2.x);
        let dy: number = Math.abs(node1.y - node2.y);
        return this.StraightCost * (dx + dy);
    }

    private IsStartNode(node: MapNode): boolean {
        return this.startNode != undefined && this.startNode.Equals(node);
    }

    private IsEndNode(node: MapNode): boolean {
        return this.endNodes.indexOf(node) != -1;
    }

    private IsInOpenDic(node: MapNode): boolean {
        return this.openDic[node.key] != undefined;
    }

    private AddOpenDic(node: MapNode) {
        this.openDic[node.key] = node;
    }

    private RemoveFromOpenDic(node: MapNode): boolean {
        if (this.IsInOpenDic(node)) {
            delete this.openDic[node.key];
            return true;
        }
        return false;
    }

    private IsInCloseDic(node: MapNode): boolean {
        return this.closeDic[node.key] != undefined;
    }

    private AddCloseDic(node: MapNode) {
        this.closeDic[node.key] = node;
    }

    private RemoveFromCloseDic(node: MapNode) {
        delete this.closeDic[node.key];
    }
}
