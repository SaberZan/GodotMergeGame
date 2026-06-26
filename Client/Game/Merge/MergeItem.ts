import { Node, Vector3 } from "godot";
import type { IMergeItem, MergeItemData } from "./Data";
import {
    BaseCom,
    ClickCMDCom,
    CoverCom,
    HoldOnCMDCom,
    MoveCMDCom,
    PosCom,
    PutDownCMDCom,
    SelectCMDCom,
    StackCom,
} from "./Components";
import type { MergeComConstructor } from "./Components";
import { MergeConst } from "./MergeConst";
import { MergeMain } from "./MergeMain";
import { MergeUtility } from "./MergeUtility";
import { Vec3, Vector3Like } from "./MergeTypes";
import type { MergeManager } from "./MergeManager";
import { SelectCMDGroup } from "./Groups";

export class MergeItem {
    public manager!: MergeManager;
    public id: number = 0;
    public itemId: number = 0;
    public inited: boolean = false;
    public data: MergeItemData | null = null;
    public coms: Map<string, BaseCom> = new Map<string, BaseCom>();
    public transform: Node | null = null;
    public position: Vector3 = Vec3();

    public GetCom<T extends BaseCom>(type: MergeComConstructor<T> | string): T | null {
        const key = typeof type === "string" ? type : type.name;
        return (this.coms.get(key) as T | undefined) ?? null;
    }

    public GetOrCreateCom<T extends BaseCom>(type: MergeComConstructor<T>): T {
        return this.AddCom(type);
    }

    public AddCom<T extends BaseCom>(type: MergeComConstructor<T>): T {
        const key = type.name;
        if (!this.coms.has(key)) {
            const com = MergeUtility.GetComFromPool(type);
            this.coms.set(key, com);
            if (this.manager.needMatchComs.has(key)) {
                this.manager.MatchGroup(this);
            }
        }
        return this.coms.get(key) as T;
    }

    public RemoveCom<T extends BaseCom>(type: MergeComConstructor<T> | string): void {
        const key = typeof type === "string" ? type : type.name;
        const com = this.coms.get(key);
        if (com == null) {
            return;
        }
        this.coms.delete(key);
        MergeUtility.PutComToPool(com);
        if (this.manager.needMatchComs.has(key)) {
            this.manager.MatchGroup(this);
        }
    }

    public RemoveAllCom(): void {
        for (const com of this.coms.values()) {
            MergeUtility.PutComToPool(com);
        }
        this.coms.clear();
        this.manager.MatchGroup(this);
    }

    public HasCom(type: MergeComConstructor | string): boolean {
        const key = typeof type === "string" ? type : type.name;
        return this.coms.has(key);
    }

    public DeSerialize(data: IMergeItem): void {
        this.id = data.GetId();
        this.itemId = data.GetItemId();
    }

    public Serialize(): unknown {
        return {
            id: this.id,
            itemId: this.itemId,
        };
    }

    public InitItemView(): void {
        const posCom = this.GetCom(PosCom);
        if (posCom != null) {
            const pos = this.manager.GetGridCenterXY(posCom.row, posCom.col);
            this.position = Vec3(pos.x, pos.y, this.position.z);
        }
    }

    public DestroyView(_delayTime: number = 0): void {
        this.transform = null;
    }

    public SelectItem(): void {
        if (this.HasCom(StackCom)) {
            this.AddCom(ClickCMDCom);
            MergeMain.Instance?.GuideShopBoxClick();
            return;
        }

        const selectGroup = this.manager.GetGroup(SelectCMDGroup);
        const items = selectGroup?.GetItems() ?? [];
        if (items.includes(this)) {
            this.AddCom(ClickCMDCom);
        }
        else {
            for (const item of items) {
                item.RemoveCom(SelectCMDCom);
            }
            this.AddCom(SelectCMDCom);
        }
        const selectCom = this.GetCom(SelectCMDCom);
        if (selectCom != null) {
            selectCom.needRefreshDetails = true;
        }
        this.manager.RealDeleteMergeItem();
    }

    public OnTap(): void {
        const posCom = this.GetCom(PosCom);
        if (posCom == null || this.HasCom(MoveCMDCom)) {
            return;
        }
        if (this.manager.isNeedGuide && (!this.manager.guideFrom.Equals(this.manager.guideTo) || posCom.row !== this.manager.guideFrom.y || posCom.col !== this.manager.guideFrom.x)) {
            return;
        }
        this.SelectItem();
    }

    public BeginDrag(): void {
        if (!this.IsCanDrag()) {
            return;
        }
        this.HideMergeHint();
        this.HideMoveAni();
        const selectGroup = this.manager.GetGroup(SelectCMDGroup);
        const items = selectGroup?.GetItems() ?? [];
        if (!items.includes(this)) {
            for (const item of items) {
                item.RemoveCom(SelectCMDCom);
            }
            this.AddCom(SelectCMDCom).needRefreshDetails = true;
        }
        this.AddCom(HoldOnCMDCom);
        this.manager.ChangeGridColor(this);
    }

    public Drag(pos: Vector3Like): void {
        if (!this.IsCanDrag()) {
            return;
        }
        this.position = Vec3(pos.x, pos.y, pos.z ?? this.position.z);
    }

    public EndDrag(effective: boolean = true): void {
        if (!this.IsCanDrag()) {
            return;
        }
        this.RemoveCom(HoldOnCMDCom);
        this.AddCom(PutDownCMDCom).effective = effective;
        const selectCom = this.GetCom(SelectCMDCom);
        if (selectCom != null) {
            selectCom.needRefreshDetails = true;
        }
    }

    public GetPosition(): Vector3 {
        return this.position;
    }

    public ShowMoveAni(targetPos: Vector3Like, _time: number, _bazier: boolean = false, callback: (() => void) | null = null): void {
        this.AddCom(MoveCMDCom);
        this.position = Vec3(targetPos.x, targetPos.y, targetPos.z ?? this.position.z);
        this.RemoveCom(MoveCMDCom);
        callback?.();
    }

    public ShowMoveAniFrom(fromPos: Vector3Like, targetPos: Vector3Like, time: number, bazier: boolean = false, callback: (() => void) | null = null): void {
        this.position = Vec3(fromPos.x, fromPos.y, fromPos.z ?? this.position.z);
        this.ShowMoveAni(targetPos, time, bazier, callback);
    }

    public HideMoveAni(): void {
        this.RemoveCom(MoveCMDCom);
    }

    public HideHoldOnEffect(): void {}
    public ShowHoldOnEffect(_targetItem: MergeItem): void {}
    public RefreshProduceConer(): void {}
    public RefreshProduceCD(): void {}
    public ShowProduceCDOver(): void {}
    public ShowRequireProgress(_targetMergeItemData: MergeItemData): void {}
    public RefreshView(): void {}
    public ShowCoverBreakEffect(_coverId: number): void {}
    public ShowReleaseEffect(): void {}
    public ShowTipsEffect(): void {}
    public ShowAcceleratorEffect(): void {}
    public ShowDisappear(): void {}
    public ShowCompose(): void {}
    public ShowRevokeSale(): void {}
    public ShowMergeHint(_item: MergeItem): void {}
    public HideMergeHint(): void {}

    private IsCanDrag(): boolean {
        if (this.itemId === MergeConst.mergeBoxId || this.HasCom(CoverCom)) {
            return false;
        }
        const posCom = this.GetCom(PosCom);
        if (posCom == null) {
            return false;
        }
        if (this.manager.isNeedGuide && (this.manager.guideFrom.Equals(this.manager.guideTo) || posCom.row !== this.manager.guideFrom.y || posCom.col !== this.manager.guideFrom.x)) {
            return false;
        }
        return !this.HasCom(MoveCMDCom);
    }
}

