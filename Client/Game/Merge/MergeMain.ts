import { Node, Vector3 } from "godot";
import { HoldOnCMDCom, PosCom, StackCom } from "./Components";
import type { IMergeGameData } from "./Data";
import { HoldOnCMDGroup } from "./Groups";
import { MergeConst } from "./MergeConst";
import type { MergeItem } from "./MergeItem";
import { MergeManager, MergeManagerInitOptions } from "./MergeManager";

export interface IMergeBridge {
    GetEnergyValue(): number;
    SubEnergyValue(value: number): void;
    ShowEnergyView(): void;
    ShowItemDetails(item: MergeItem): void;
    GenOneMergeItem(itemId: number): void;
    RemoveOneMergeItem(itemId: number, id: number): void;
    SetMergeGameData(): void;
    GuideStepOver(): void;
    GuideShopBoxClick(): void;
    GuideMergeItemFromOrder(): void;
    GuideMergeItemFromShop(): void;
    GuideMergeGenBubble(): void;
    GuideMergeGenRequire(): void;
    GuideMergeProduceNoEnergy(): void;
    GuideMergeGenTool(): void;
    NoEmptyGrid(): void;
    IsMergeGuideOver(): boolean;
    IsShopGuideTriggered(): boolean;
    OnMerge(): void;
}

export class EmptyMergeBridge implements IMergeBridge {
    public GetEnergyValue(): number { return 0; }
    public SubEnergyValue(_value: number): void {}
    public ShowEnergyView(): void {}
    public ShowItemDetails(_item: MergeItem): void {}
    public GenOneMergeItem(_itemId: number): void {}
    public RemoveOneMergeItem(_itemId: number, _id: number): void {}
    public SetMergeGameData(): void {}
    public GuideStepOver(): void {}
    public GuideShopBoxClick(): void {}
    public GuideMergeItemFromOrder(): void {}
    public GuideMergeItemFromShop(): void {}
    public GuideMergeGenBubble(): void {}
    public GuideMergeGenRequire(): void {}
    public GuideMergeProduceNoEnergy(): void {}
    public GuideMergeGenTool(): void {}
    public NoEmptyGrid(): void {}
    public IsMergeGuideOver(): boolean { return true; }
    public IsShopGuideTriggered(): boolean { return true; }
    public OnMerge(): void {}
}

export class MergeMain extends Node {
    public static Instance: MergeMain | null = null;

    public chessBoard: Node | null = null;
    public selectImg: Node | null = null;
    public pieceLayer: Node | null = null;
    public overLayer: Node | null = null;
    public gridPrefab: Node | null = null;
    public piecePrefab: Node | null = null;
    public mergePieceShop: Node | null = null;
    public mergePieceTips: Node | null = null;
    public Effect_Merge_Pieceloop: Node | null = null;
    public Effect_Merge_Accelerator: Node | null = null;
    public ConerCharging: Node | null = null;
    public ConerLock: Node | null = null;
    public ConerLightning: Node | null = null;
    public Effect_Merge_Absorb: Node | null = null;
    public Effect_Merge_Release: Node | null = null;

    private mergeBridge: IMergeBridge = new EmptyMergeBridge();
    private guideLock: boolean = false;
    private lostFrame: boolean = false;
    private framesAllGame: number = 0;
    private allGameTime: number = 0;
    private costPowerCount: number = 0;
    private isFtue: boolean = false;

    public _ready(): void {
        MergeMain.Instance = this;
    }

    public Init(mergeGameData: IMergeGameData | null, issue: number, isResetInfo: boolean, bridge: IMergeBridge | null = null, options: MergeManagerInitOptions = {}): void {
        if (bridge != null) {
            this.mergeBridge = bridge;
        }
        if (isResetInfo) {
            this.allGameTime = 0;
            this.framesAllGame = 0;
            this.costPowerCount = 0;
            this.isFtue = !this.IsMergeGuideOver();
        }
        MergeManager.Instance.Init(mergeGameData, issue, options);
    }

    public Update(deltaTime: number): void {
        MergeManager.Instance.Update(deltaTime);
        if (deltaTime >= 5 || this.lostFrame) {
            this.lostFrame = false;
            return;
        }
        this.framesAllGame++;
        this.allGameTime += deltaTime;
    }

    public Destroy(): void {
        MergeManager.Instance.Destroy();
    }

    public _exit_tree(): void {
        if (MergeMain.Instance === this) {
            MergeMain.Instance = null;
        }
    }

    public GetAvgFrame(): number {
        if (this.allGameTime === 0) {
            return 0;
        }
        return this.framesAllGame / this.allGameTime;
    }

    public GetCostPowerCount(): number {
        const tmp = this.costPowerCount;
        this.costPowerCount = 0;
        return tmp;
    }

    public FtueOrNot(): boolean {
        return this.isFtue;
    }

    public SetMergeGameData(): void { this.mergeBridge.SetMergeGameData(); }
    public GetEnergyValue(): number { return this.mergeBridge.GetEnergyValue(); }
    public SubEnergyValue(value: number = 1): void { this.costPowerCount += value; this.mergeBridge.SubEnergyValue(value); }
    public ShowEnergyView(): void { this.mergeBridge.ShowEnergyView(); }
    public ShowItemDetails(item: MergeItem): void { this.mergeBridge.ShowItemDetails(item); }
    public GenOneMergeItem(itemId: number): void { this.mergeBridge.GenOneMergeItem(itemId); }
    public RemoveOneMergeItem(itemId: number, id: number): void { this.mergeBridge.RemoveOneMergeItem(itemId, id); }
    public GuideStepOver(): void { this.mergeBridge.GuideStepOver(); }
    public GuideShopBoxClick(): void { this.mergeBridge.GuideShopBoxClick(); }
    public GuideMergeItemFromOrder(): void { this.mergeBridge.GuideMergeItemFromOrder(); }
    public GuideMergeItemFromShop(): void { this.mergeBridge.GuideMergeItemFromShop(); }
    public GuideMergeGenBubble(): void { this.mergeBridge.GuideMergeGenBubble(); }
    public GuideMergeGenRequire(): void { this.mergeBridge.GuideMergeGenRequire(); }
    public GuideMergeProduceNoEnergy(): void { this.mergeBridge.GuideMergeProduceNoEnergy(); }
    public GuideMergeGenTool(): void { this.mergeBridge.GuideMergeGenTool(); }
    public NoEmptyGrid(): void { this.mergeBridge.NoEmptyGrid(); }
    public IsMergeGuideOver(): boolean { return this.mergeBridge.IsMergeGuideOver(); }
    public IsShopGuideTriggered(): boolean { return this.mergeBridge.IsShopGuideTriggered(); }
    public OnMergeItem(): void { this.mergeBridge.OnMerge(); }

    public AddStackItem(itemId: number): void {
        const mergeBox = MergeManager.Instance.GetMergeItemByRowCol(MergeConst.MaxRow - 1, 0);
        const stackCom = mergeBox?.GetCom(StackCom);
        stackCom?.cache.push(itemId);
        this.SetMergeGameData();
    }

    public GetStackItemCount(itemId: number): number {
        const mergeBox = MergeManager.Instance.GetMergeItemByRowCol(MergeConst.MaxRow - 1, 0);
        const stackCom = mergeBox?.GetCom(StackCom);
        if (stackCom == null) {
            return 0;
        }
        let count = 0;
        for (const id of stackCom.items) {
            if (id === itemId) {
                count++;
            }
        }
        for (const id of stackCom.cache) {
            if (id === itemId) {
                count++;
            }
        }
        return count;
    }

    public GetNoCoverMergeItemNum(itemId: number): number { return MergeManager.Instance.GetNoCoverMergeItemNum(itemId); }
    public AddTargetId(itemIds: number[]): void { MergeManager.Instance.AddTargetId(itemIds); }
    public CollectTarget(itemId: number, num: number, _collectPos: Vector3, overCallBack: (() => void) | null = null): void {
        MergeManager.Instance.RemoveTargetId(itemId);
        const items = MergeManager.Instance.GetNoCoverMergeItemList(itemId);
        const removeCount = Math.min(num, items.length);
        for (let i = 0; i < removeCount; ++i) {
            MergeManager.Instance.RemoveMergeItem(items[i]);
        }
        overCallBack?.();
    }

    public OnCollectTargetReward(_itemId: number, _num: number, _collectPos: Vector3): void {
        this.GuideMergeItemFromOrder();
    }

    public DeleteMergeItem(id: number): void { MergeManager.Instance.DeleteMergeItem(id); }
    public RevokeDeleteMergeItem(_id?: number): void { MergeManager.Instance.RevokeDeleteMergeItem(); }
    public BuyMergeItemProduceCD(id: number): void { MergeManager.Instance.ResetProduceCD(id); }
    public BuyMergeItemBubbleCD(id: number): void { MergeManager.Instance.BuyBubbleItem(id); }
    public GetMergeManager(): MergeManager { return MergeManager.Instance; }
    public GetGirdWorldPos(row: number, col: number): Vector3 { const pos = MergeManager.Instance.GetGridCenterXY(row, col); return new Vector3(pos.x, pos.y, 0); }
    public GetMergeItemByRowCol(row: number, col: number): MergeItem | null { return MergeManager.Instance.GetMergeItemByRowCol(row, col); }
    public GetLowerMergeItem(): MergeItem | null { return MergeManager.Instance.GetLowerMergeItem(); }
    public GetBubbleMergeItem(): MergeItem | null { return MergeManager.Instance.GetBubbleMergeItem(); }
    public GetRequireMergeItem(): MergeItem | null { return MergeManager.Instance.GetRequireMergeItem(); }
    public GetToolMergeItem(): MergeItem | null { return MergeManager.Instance.GetToolMergeItem(); }
    public SelectMergeItem(item: MergeItem): void { item.SelectItem(); }
    public SelectMergeItemByRowCol(row: number, col: number): void { MergeManager.Instance.GetMergeItemByRowCol(row, col)?.SelectItem(); }
    public SetGuideRowCol(fromRow: number, fromCol: number, toRow: number, toCol: number, isForceStep: boolean): void { MergeManager.Instance.SetGuideRowCol(fromRow, fromCol, toRow, toCol, isForceStep); }
    public IsInForceGuide(): boolean { return MergeManager.Instance.isForceStep || this.guideLock; }
    public SetMergeGuideOver(): void { MergeManager.Instance.SetMergeGuideOver(); }
    public UnGuideLock(): void { this.guideLock = false; }
    public OnShopClose(): void { this.GuideMergeItemFromShop(); }
    public CollectAward(_startPos: Vector3, _endPos: Vector3, overCallBack: (() => void) | null, _effectAward: Node | null, _isInverse: boolean = false): void { overCallBack?.(); }
    public GetCobWebSprite(): null { return null; }
    public GetBubbleSprite(): null { return null; }
    public GetGridObject(item: MergeItem): Node | null {
        const posCom = item.GetCom(PosCom);
        if (posCom == null) {
            return null;
        }
        return MergeManager.Instance.gridMap[posCom.row]?.[posCom.col]?.transform ?? null;
    }

    public ReturnBackHoldOnItem(): void {
        const holdOnGroup = MergeManager.Instance.GetGroup(HoldOnCMDGroup);
        for (const item of holdOnGroup?.GetItems() ?? []) {
            item.RemoveCom(HoldOnCMDCom);
            const posCom = item.GetCom(PosCom);
            if (posCom != null) {
                item.ShowMoveAni(item.manager.GetGridCenterXY(posCom.row, posCom.col), 0.2, false);
            }
        }
    }
}
