import { Vector2 } from "godot";
import { CoverCom, DeleteCMDCom, MergeCom, MergeComConstructor, MergeHintCMDCom, PosCom, ProduceCom, SelectCMDCom, StackCom, ToolCom } from "./Components";
import { IMergeGameData, MergeGridMap, MergeItemData, MergeUpgradeData, UpgradeDataNode } from "./Data";
import { Grid } from "./Grid";
import { BaseGroup, CanMergeGroup, ClickCMDGroup, CoverGroup, DeleteCMDGroup, HoldOnCMDGroup, MergeHintCMDGroup, NoCoverGroup, ProduceGroup, PutDownCMDGroup, SelectCMDGroup } from "./Groups";
import { MergeConst, PieceItemType } from "./MergeConst";
import { MergeItem } from "./MergeItem";
import { MergeLogic } from "./MergeLogic";
import { MergeMain } from "./MergeMain";
import { Vec2, Vector2Int } from "./MergeTypes";
import { MergeUtility } from "./MergeUtility";

type GroupConstructor<T extends BaseGroup = BaseGroup> = new () => T;

export class MergeManager {
    private static readonly _Instance: MergeManager = new MergeManager();

    public static get Instance(): MergeManager {
        return this._Instance;
    }

    public level: string = "test";
    public mergeItemNum: number = 0;
    public gridMap: Grid[][] = [];
    public items: Array<Array<MergeItem | null>> = [];
    public groups: Map<string, BaseGroup> = new Map<string, BaseGroup>();
    public needMatchComs: Set<string> = new Set<string>();
    public allMergeItems: Set<MergeItem> = new Set<MergeItem>();
    public mergeItemsPool: MergeItem[] = [];
    public mergeLogic: MergeLogic | null = null;
    public targetIds: number[] = [];
    public nowTime: number = 0;
    public Inited: boolean = false;
    public IsNeedRecord: boolean = false;
    public isNeedGuide: boolean = false;
    public isForceStep: boolean = false;
    public stepOverTag: boolean = false;
    public guideFrom: Vector2Int = Vector2Int.zero;
    public guideTo: Vector2Int = Vector2Int.zero;

    private mergeItemDatas: Map<number, MergeItemData> = new Map<number, MergeItemData>();
    private upgradeDatas: Map<number, UpgradeDataNode> = new Map<number, UpgradeDataNode>();
    private mergeGridMap: MergeGridMap = new MergeGridMap();

    public Init(mergeGameData: IMergeGameData | null, issue: number, options: MergeManagerInitOptions = {}): void {
        MergeUtility.ClearPool();
        this.level = mergeGameData?.GetLevel() || options.level || "test";
        this.InitData(issue, options);
        this.InitGroup();
        this.InitGrid();
        if (mergeGameData != null) {
            this.DeSerialize(mergeGameData);
        }
        else {
            this.InitMergeItem();
        }
        this.InitLogic();
        this.Inited = true;
    }

    public Destroy(): void {
        this.Inited = false;
        this.groups.clear();
        this.needMatchComs.clear();
        for (const row of this.items) {
            for (const item of row) {
                if (item != null) {
                    this.RemoveMergeItem(item);
                }
            }
        }
        for (const row of this.gridMap) {
            for (const grid of row) {
                grid.Destroy();
            }
        }
        this.gridMap = [];
        this.items = [];
        this.mergeLogic = null;
        this.mergeItemDatas.clear();
        this.upgradeDatas.clear();
        this.allMergeItems.clear();
        this.targetIds.length = 0;
        MergeUtility.ClearPool();
    }

    public Update(deltaTime: number = 0): void {
        this.nowTime += Math.max(0, Math.floor(deltaTime));
        this.mergeLogic?.Update(this);
        if (this.Inited && this.IsNeedRecord) {
            this.IsNeedRecord = false;
            MergeMain.Instance?.SetMergeGameData();
        }
        if (this.stepOverTag) {
            this.stepOverTag = false;
            MergeMain.Instance?.GuideStepOver();
        }
    }

    public MatchGroup(item: MergeItem): void {
        if (!item.inited) {
            return;
        }
        this.IsNeedRecord = true;
        for (const group of this.groups.values()) {
            group.Match(item);
        }
    }

    public GetGroup<T extends BaseGroup>(type: GroupConstructor<T>): T | null {
        return (this.groups.get(type.name) as T | undefined) ?? null;
    }

    public DeSerialize(iMergeGameData: IMergeGameData): void {
        this.items = this.CreateItemArray();
        for (let i = 0; i < MergeConst.MaxRow; i++) {
            for (let j = 0; j < MergeConst.MaxCol; j++) {
                const iMergeItem = iMergeGameData.GetItem(i, j);
                if (iMergeItem == null) {
                    continue;
                }
                const item = this.CreateMergeItemRaw();
                item.DeSerialize(iMergeItem);
                this.ApplyDataAndStaticComs(item);

                const iProduceCom = iMergeGameData.GetProduce(item.id);
                if (iProduceCom != null) {
                    item.AddCom(ProduceCom).DeSerialize(iProduceCom);
                }
                const iCoverCom = iMergeGameData.GetCover(item.id);
                if (iCoverCom != null) {
                    item.AddCom(CoverCom).DeSerialize(iCoverCom);
                }
                const iStackCom = iMergeGameData.GetStack(item.id);
                if (iStackCom != null) {
                    item.AddCom(StackCom).DeSerialize(iStackCom);
                }

                const posCom = item.AddCom(PosCom);
                posCom.row = i;
                posCom.col = j;
                this.items[i][j] = item;
                item.InitItemView();
            }
        }
        this.mergeItemNum = iMergeGameData.GetMergeItemNum();
    }

    public GetMergeItemByRowCol(row: number, col: number): MergeItem | null {
        if (row >= 0 && row < this.items.length && col >= 0 && col < (this.items[row]?.length ?? 0)) {
            return this.items[row][col];
        }
        return null;
    }

    public CreateMergeItem(itemIdOrData?: number | MergeItemData, coverId: number = 0): MergeItem {
        this.IsNeedRecord = true;
        if (itemIdOrData instanceof MergeItemData) {
            return this.CreateMergeItemFromData(itemIdOrData, coverId);
        }
        if (typeof itemIdOrData === "number") {
            if (itemIdOrData === MergeConst.mergeBoxId) {
                return this.CreateMergeBox(itemIdOrData);
            }
            const data = this.RequireMergeItemData(itemIdOrData);
            return this.CreateMergeItemFromData(data, coverId);
        }
        return this.CreateMergeItemRaw();
    }

    public CreateMergeBox(itemId: number): MergeItem {
        const mergeItem = this.CreateMergeItemWithComs([PosCom, StackCom]);
        mergeItem.itemId = itemId;
        return mergeItem;
    }

    public CreateMergeItemFromData(data: MergeItemData, coverId: number = 0): MergeItem {
        const comTypes: MergeComConstructor[] = [PosCom];
        if (coverId !== 0) {
            comTypes.push(CoverCom);
        }
        if (data.ItemType === PieceItemType.Produce) {
            comTypes.push(ProduceCom);
        }
        else if (data.ItemType === PieceItemType.Tool) {
            comTypes.push(ToolCom);
        }
        if (this.upgradeDatas.get(data.ItemID)?.NextDataNode != null) {
            comTypes.push(MergeCom);
        }

        const mergeItem = this.CreateMergeItemWithComs(comTypes);
        mergeItem.itemId = data.ItemID;
        mergeItem.data = data;
        if (coverId !== 0) {
            mergeItem.GetCom(CoverCom)!.coverId = coverId;
        }
        if (data.ItemType === PieceItemType.Produce) {
            const produceCom = mergeItem.GetCom(ProduceCom)!;
            produceCom.times = data.GenerateTimes;
            if (data.GenerateTimes !== 0) {
                --produceCom.times;
            }
            produceCom.residueNum = data.RequiredItemLength > 0 ? 0 : data.GernerateNumber;
        }
        return mergeItem;
    }

    public RemoveMergeItem(mergeItem: MergeItem, delayTime: number = 0): void {
        this.IsNeedRecord = true;
        const posCom = mergeItem.GetCom(PosCom);
        if (posCom != null && this.items[posCom.row] != null) {
            this.items[posCom.row][posCom.col] = null;
        }
        const id = mergeItem.id;
        const itemId = mergeItem.itemId;
        mergeItem.RemoveAllCom();
        mergeItem.DestroyView(delayTime);
        mergeItem.inited = false;
        this.allMergeItems.delete(mergeItem);
        this.mergeItemsPool.push(mergeItem);
        if (this.Inited && posCom != null) {
            this.HideGridColor(posCom.row, posCom.col);
            MergeMain.Instance?.RemoveOneMergeItem(itemId, id);
        }
    }

    public GetEmptyGrid(): Vector2Int | null {
        const empties = this.GetEmptyGrids();
        if (empties.length === 0) {
            return null;
        }
        return empties[Math.floor(Math.random() * empties.length)];
    }

    public GetEmptyGrids(): Vector2Int[] {
        const empties: Vector2Int[] = [];
        for (let i = 0; i < this.items.length; i++) {
            for (let j = 0; j < this.items[i].length; j++) {
                if (this.items[i][j] == null) {
                    empties.push(new Vector2Int(j, i));
                }
            }
        }
        return empties;
    }

    public GetGridCenterXY(row: number, col: number): Vector2 {
        return this.gridMap[row]?.[col]?.position ?? Vec2(MergeConst.OffSetX + col * MergeConst.CellWidth, MergeConst.OffSetY + row * MergeConst.CellHeight);
    }

    public GetRowCol(y: number, x: number): Vector2Int | null {
        const row = Math.floor((y - MergeConst.OffSetY + MergeConst.CellHeight / 2) / MergeConst.CellHeight);
        const col = Math.floor((x - MergeConst.OffSetX + MergeConst.CellWidth / 2) / MergeConst.CellWidth);
        if (row >= 0 && row < MergeConst.MaxRow && col >= 0 && col < MergeConst.MaxCol) {
            return new Vector2Int(col, row);
        }
        return null;
    }

    public GetMergeItemData(itemId: number): MergeItemData | null {
        return this.mergeItemDatas.get(itemId) ?? null;
    }

    public GetNextMergeItemData(itemId: number): MergeItemData | null {
        const nextNode = this.upgradeDatas.get(itemId)?.NextDataNode;
        if (nextNode == null) {
            return null;
        }
        return this.GetMergeItemData(nextNode.mergeUpgradeData.ItemID);
    }

    public GetMergeUpgradeData(itemId: number): MergeUpgradeData | null {
        return this.upgradeDatas.get(itemId)?.mergeUpgradeData ?? null;
    }

    public GetTime(): number {
        return this.nowTime;
    }

    public ResetProduceCD(itemOrId: MergeItem | number): void {
        const item = typeof itemOrId === "number" ? this.GetNoCoverItemByRuntimeId(itemOrId) : itemOrId;
        if (item == null || !item.HasCom(ProduceCom) || item.data == null) {
            return;
        }
        const produceCom = item.GetCom(ProduceCom)!;
        produceCom.cdStartTimestamp = 0;
        produceCom.cdEndTimestamp = 0;
        produceCom.autoRecoveryStartTimestamp = 0;
        produceCom.residueNum = item.data.GernerateNumber;
        produceCom.hasProduces.clear();
        const selectCom = item.GetCom(SelectCMDCom);
        if (selectCom != null) {
            selectCom.needRefreshDetails = true;
        }
        item.ShowProduceCDOver();
        item.RefreshProduceConer();
    }

    public RealDeleteMergeItem(): void {
        for (const item of [...(this.GetGroup(DeleteCMDGroup)?.GetItems() ?? [])]) {
            this.RemoveMergeItem(item);
        }
    }

    public HideMergeHintMergeItem(): void {
        for (const item of this.GetGroup(MergeHintCMDGroup)?.GetItems() ?? []) {
            item.RemoveCom(MergeHintCMDCom.name);
            item.HideMergeHint();
        }
    }

    public DealTemporaryMergeItem(): void {
        this.RealDeleteMergeItem();
        this.HideMergeHintMergeItem();
    }

    public AddTargetId(itemIds: number[]): void {
        this.targetIds.push(...itemIds);
        const itemIdSet = new Set(itemIds);
        for (const item of this.GetGroup(NoCoverGroup)?.GetItems() ?? []) {
            if (itemIdSet.has(item.itemId)) {
                const posCom = item.GetCom(PosCom);
                if (posCom != null) {
                    this.gridMap[posCom.row][posCom.col].ShowHighLight();
                }
            }
        }
    }

    public RemoveTargetId(itemId: number): void {
        const index = this.targetIds.indexOf(itemId);
        if (index >= 0) {
            this.targetIds.splice(index, 1);
        }
        if (!this.targetIds.includes(itemId)) {
            for (const item of this.GetGroup(NoCoverGroup)?.GetItems() ?? []) {
                if (item.itemId === itemId) {
                    const posCom = item.GetCom(PosCom);
                    if (posCom != null) {
                        this.gridMap[posCom.row][posCom.col].FadeHighLight();
                    }
                }
            }
        }
    }

    public HideGridColor(row: number, col: number): void {
        this.gridMap[row]?.[col]?.FadeHighLight();
    }

    public ChangeGridColor(item: MergeItem): void {
        const posCom = item.GetCom(PosCom);
        if (posCom == null) {
            return;
        }
        const grid = this.gridMap[posCom.row]?.[posCom.col];
        if (grid == null) {
            return;
        }
        if (item.HasCom(CoverCom) || item.HasCom(DeleteCMDCom) || !this.targetIds.includes(item.itemId)) {
            grid.FadeHighLight();
            return;
        }
        grid.ShowHighLight();
    }

    public SetGuideRowCol(fromRow: number, fromCol: number, toRow: number, toCol: number, forceStep: boolean): void {
        this.isForceStep = forceStep;
        this.isNeedGuide = true;
        this.HideMergeHintMergeItem();
        this.guideFrom = new Vector2Int(fromCol, fromRow);
        this.guideTo = new Vector2Int(toCol, toRow);
    }

    public SetMergeGuideOver(): void {
        this.isNeedGuide = false;
        this.isForceStep = false;
    }

    public GetNoCoverMergeItemNum(itemId: number): number {
        return (this.GetGroup(NoCoverGroup)?.GetItems() ?? []).filter((item) => item.itemId === itemId).length;
    }

    public GetNoCoverMergeItemList(itemId: number): MergeItem[] {
        return (this.GetGroup(NoCoverGroup)?.GetItems() ?? []).filter((item) => item.itemId === itemId);
    }

    public DeleteMergeItem(id: number): void {
        const item = this.GetNoCoverItemByRuntimeId(id);
        if (item != null) {
            item.AddCom(DeleteCMDCom);
            item.DestroyView();
            this.ChangeGridColor(item);
        }
    }

    public RevokeDeleteMergeItem(): void {
        for (const item of this.GetGroup(DeleteCMDGroup)?.GetItems() ?? []) {
            item.RemoveCom(DeleteCMDCom);
            item.InitItemView();
            item.ShowRevokeSale();
            this.ChangeGridColor(item);
        }
    }

    public BuyBubbleItem(id: number): void {
        const item = (this.GetGroup(CoverGroup)?.GetItems() ?? []).find((groupItem) => groupItem.id === id);
        if (item == null) {
            return;
        }
        const coverCom = item.GetCom(CoverCom);
        if (coverCom == null) {
            return;
        }
        item.ShowCoverBreakEffect(coverCom.coverId);
        item.RemoveCom(CoverCom);
        item.RefreshView();
        this.ChangeGridColor(item);
    }

    public GetLowerMergeItem(): MergeItem | null {
        return this.GetGroup(NoCoverGroup)?.GetItems()[0] ?? null;
    }

    public GetBubbleMergeItem(): MergeItem | null {
        return (this.GetGroup(CoverGroup)?.GetItems() ?? []).find((item) => item.GetCom(CoverCom)?.coverId === 4) ?? null;
    }

    public GetRequireMergeItem(): MergeItem | null {
        return (this.GetGroup(ProduceGroup)?.GetItems() ?? []).find((item) => item.data != null && item.data.RequiredItemLength > (item.GetCom(ProduceCom)?.hasRequires.length ?? 0) && (item.GetCom(ProduceCom)?.residueNum ?? 0) === 0) ?? null;
    }

    public GetToolMergeItem(): MergeItem | null {
        return (this.GetGroup(NoCoverGroup)?.GetItems() ?? []).find((item) => item.HasCom(ToolCom)) ?? null;
    }

    public ConfigureData(itemDatas: MergeItemData[] = [], upgradeDatas: MergeUpgradeData[] = [], gridMap: MergeGridMap | null = null): void {
        this.mergeItemDatas = new Map(itemDatas.map((data) => [data.ItemID, data]));
        this.upgradeDatas.clear();
        const orderedUpgrades = [...upgradeDatas].sort((a, b) => a.ItemSeries - b.ItemSeries || a.ItemLevel - b.ItemLevel);
        let previous: UpgradeDataNode | null = null;
        for (const upgradeData of orderedUpgrades) {
            const node = new UpgradeDataNode(upgradeData);
            this.upgradeDatas.set(upgradeData.ItemID, node);
            if (previous != null && previous.mergeUpgradeData.ItemSeries === upgradeData.ItemSeries) {
                previous.NextDataNode = node;
            }
            previous = node;
        }
        if (gridMap != null) {
            this.mergeGridMap = gridMap;
        }
    }

    private InitData(_issue: number, options: MergeManagerInitOptions): void {
        this.ConfigureData(options.itemDatas ?? [], options.upgradeDatas ?? [], options.gridMap ?? null);
    }

    private InitGroup(): void {
        this.groups.clear();
        const groupTypes = [ProduceGroup, CoverGroup, NoCoverGroup, ClickCMDGroup, HoldOnCMDGroup, PutDownCMDGroup, DeleteCMDGroup, SelectCMDGroup, CanMergeGroup, MergeHintCMDGroup];
        for (const groupType of groupTypes) {
            const group = new groupType();
            this.groups.set(groupType.name, group);
            for (const comType of [...group.include, ...group.fitter]) {
                this.needMatchComs.add(comType.name);
            }
        }
    }

    private InitGrid(): void {
        this.gridMap = [];
        for (let i = 0; i < MergeConst.MaxRow; i++) {
            const row: Grid[] = [];
            for (let j = 0; j < MergeConst.MaxCol; j++) {
                const grid = new Grid();
                grid.manager = this;
                grid.CreateMapView(i, j);
                grid.position = Vec2(MergeConst.OffSetX + j * MergeConst.CellWidth, MergeConst.OffSetY + i * MergeConst.CellHeight);
                row.push(grid);
            }
            this.gridMap.push(row);
        }
    }

    private InitMergeItem(): void {
        this.items = this.CreateItemArray();
        for (let i = 0; i < this.mergeGridMap.GridsLength; i++) {
            const mergeRowGrid = this.mergeGridMap.Grids(i);
            if (mergeRowGrid == null) {
                continue;
            }
            for (let j = 0; j < mergeRowGrid.ElementLength; j++) {
                const element = mergeRowGrid.Element(j);
                if (element === 0) {
                    continue;
                }
                const itemId = Math.floor(element / 10);
                const coverId = element % 10;
                const mergeItem = this.CreateMergeItem(itemId, coverId);
                const posCom = mergeItem.GetCom(PosCom)!;
                posCom.row = i;
                posCom.col = j;
                this.items[i][j] = mergeItem;
                mergeItem.InitItemView();
            }
        }
    }

    private InitLogic(): void {
        this.mergeLogic = new MergeLogic();
        this.mergeLogic.Init();
    }

    private CreateMergeItemWithComs(comTypes: MergeComConstructor[]): MergeItem {
        const item = this.CreateMergeItemRaw();
        for (const comType of comTypes) {
            item.AddCom(comType);
        }
        this.MatchGroup(item);
        return item;
    }

    private CreateMergeItemRaw(): MergeItem {
        const item = this.mergeItemsPool.pop() ?? new MergeItem();
        item.manager = this;
        item.id = this.mergeItemNum++;
        item.inited = true;
        item.coms.clear();
        item.data = null;
        this.allMergeItems.add(item);
        return item;
    }

    private ApplyDataAndStaticComs(item: MergeItem): void {
        if (item.itemId === MergeConst.mergeBoxId) {
            return;
        }
        item.data = this.RequireMergeItemData(item.itemId);
        if (item.data.ItemType === PieceItemType.Tool) {
            item.AddCom(ToolCom);
        }
        if (this.upgradeDatas.get(item.itemId)?.NextDataNode != null) {
            item.AddCom(MergeCom);
        }
    }

    private RequireMergeItemData(itemId: number): MergeItemData {
        const data = this.mergeItemDatas.get(itemId);
        if (data == null) {
            throw new Error(`MergeItemData not found: ${itemId}`);
        }
        return data;
    }

    private CreateItemArray(): Array<Array<MergeItem | null>> {
        return Array.from({ length: MergeConst.MaxRow }, () => Array.from<MergeItem | null>({ length: MergeConst.MaxCol }).fill(null));
    }

    private GetNoCoverItemByRuntimeId(id: number): MergeItem | null {
        return (this.GetGroup(NoCoverGroup)?.GetItems() ?? []).find((item) => item.id === id) ?? null;
    }
}

export interface MergeManagerInitOptions {
    level?: string;
    gridMap?: MergeGridMap;
    itemDatas?: MergeItemData[];
    upgradeDatas?: MergeUpgradeData[];
}
