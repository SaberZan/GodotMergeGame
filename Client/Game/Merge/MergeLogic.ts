import { Vector3 } from "godot";
import { CoverCom, CoverType, ClickCMDCom, HoldOnCMDCom, MergeCom, MergeHintCMDCom, MoveCMDCom, PosCom, ProduceCMDCom, ProduceCom, PutDownCMDCom, SelectCMDCom, StackCom, ToolCom } from "./Components";
import { MergeConst } from "./MergeConst";
import type { MergeItem } from "./MergeItem";
import { MergeMain } from "./MergeMain";
import type { MergeManager } from "./MergeManager";
import { CanMergeGroup, ClickCMDGroup, CoverGroup, HoldOnCMDGroup, MergeHintCMDGroup, NoCoverGroup, ProduceGroup, PutDownCMDGroup, SelectCMDGroup } from "./Groups";
import { Distance2 } from "./MergeTypes";
import { MergeUtility } from "./MergeUtility";

export class BaseLogic {
    public Update(_manager: MergeManager): void {
    }
}

export class MergeLogic {
    public logics: BaseLogic[] = [];

    public Init(): void {
        this.logics.push(new MergeHintLogic());
        this.logics.push(new ClickItemLogic());
        this.logics.push(new HoldOnItemLogic());
        this.logics.push(new PutDownItemLogic());
        this.logics.push(new ProduceItemLogic());
        this.logics.push(new CoverItemLogic());
        this.logics.push(new SelectLogic());
    }

    public Update(manager: MergeManager): void {
        for (const logic of this.logics) {
            logic.Update(manager);
        }
    }
}

export class ClickItemLogic extends BaseLogic {
    public override Update(manager: MergeManager): void {
        const items = [...(manager.GetGroup(ClickCMDGroup)?.GetItems() ?? [])];
        if (items.length > 0) {
            manager.DealTemporaryMergeItem();
        }
        for (const item of items) {
            this.Clicked(item);
            item.RemoveCom(ClickCMDCom);
            manager.stepOverTag = true;
        }
    }

    private Clicked(item: MergeItem): void {
        if (item.HasCom(StackCom)) {
            this.ClickStack(item);
            return;
        }
        if (item.HasCom(ToolCom)) {
            this.ClickTool(item);
            return;
        }
        if (item.HasCom(CoverCom)) {
            this.ClickCover(item);
            return;
        }
        if (item.HasCom(ProduceCom)) {
            this.ClickProduce(item);
        }
    }

    private ClickStack(item: MergeItem): void {
        const stackCom = item.GetCom(StackCom);
        const empty = item.manager.GetEmptyGrid();
        if (stackCom == null || stackCom.items.length === 0 || empty == null) {
            return;
        }
        const target = item.manager.isNeedGuide ? { x: 3, y: 3 } : empty;
        const itemId = stackCom.Pop();
        const posCom = item.GetCom(PosCom);
        if (itemId == null || posCom == null) {
            return;
        }
        this.FlyItem(item.manager, itemId, posCom.row, posCom.col, target.y, target.x);
    }

    private ClickTool(item: MergeItem): void {
        const manager = item.manager;
        const nowTime = manager.GetTime();
        const removeCD = item.data?.CoolDownTime ?? 0;
        for (const produceItem of manager.GetGroup(ProduceGroup)?.GetItems() ?? []) {
            const produceCom = produceItem.GetCom(ProduceCom);
            if (produceCom != null && produceCom.cdEndTimestamp > 0) {
                produceCom.cdEndTimestamp -= removeCD;
                if (produceCom.cdEndTimestamp <= nowTime) {
                    manager.ResetProduceCD(produceItem);
                }
            }
        }
        item.ShowAcceleratorEffect();
        manager.RemoveMergeItem(item, 0.5);
    }

    private ClickCover(_item: MergeItem): void {
    }

    private ClickProduce(item: MergeItem): void {
        const produceCom = item.GetCom(ProduceCom);
        if (produceCom == null) {
            return;
        }
        if (produceCom.residueNum > 0) {
            item.AddCom(ProduceCMDCom);
        }
        else if (produceCom.cdEndTimestamp === 0 && (item.data?.RequiredItemLength ?? 0) > 0 && produceCom.hasRequires.length < (item.data?.RequiredItemLength ?? 0)) {
            item.ShowTipsEffect();
        }
    }

    private FlyItem(manager: MergeManager, itemId: number, fromRow: number, fromCol: number, targetRow: number, targetCol: number): void {
        const newItem = manager.CreateMergeItem(itemId);
        manager.items[targetRow][targetCol] = newItem;
        const newPosCom = newItem.GetCom(PosCom)!;
        newPosCom.row = targetRow;
        newPosCom.col = targetCol;
        newItem.InitItemView();
        MergeMain.Instance?.GenOneMergeItem(newItem.itemId);
        newItem.ShowMoveAniFrom(manager.GetGridCenterXY(fromRow, fromCol), manager.GetGridCenterXY(targetRow, targetCol), 0.2, true);
        if (!newItem.HasCom(CoverCom) && (newItem.data?.RequiredItemLength ?? 0) > 0 && newItem.GetCom(ProduceCom)?.residueNum === 0) {
            MergeMain.Instance?.GuideMergeGenRequire();
        }
        if (newItem.HasCom(ToolCom)) {
            MergeMain.Instance?.GuideMergeGenTool();
        }
    }
}

export class HoldOnItemLogic extends BaseLogic {
    public override Update(manager: MergeManager): void {
        const items = manager.GetGroup(HoldOnCMDGroup)?.GetItems() ?? [];
        if (items.length > 0) {
            manager.DealTemporaryMergeItem();
        }
        for (const item of items) {
            this.CheckHold(item);
        }
    }

    private CheckHold(selectMergeItem: MergeItem): void {
        const manager = selectMergeItem.manager;
        const selectPosCom = selectMergeItem.GetCom(PosCom);
        const rowCol = manager.GetRowCol(selectMergeItem.GetPosition().y, selectMergeItem.GetPosition().x);
        if (selectPosCom == null || rowCol == null || (selectPosCom.row === rowCol.y && selectPosCom.col === rowCol.x)) {
            selectMergeItem.HideHoldOnEffect();
            return;
        }
        if (manager.isNeedGuide && (manager.guideTo.y !== rowCol.y || manager.guideTo.x !== rowCol.x)) {
            selectMergeItem.HideHoldOnEffect();
            return;
        }
        const targetMergeItem = manager.GetMergeItemByRowCol(rowCol.y, rowCol.x);
        if (targetMergeItem == null) {
            selectMergeItem.HideHoldOnEffect();
            return;
        }
        if (this.CanActOn(selectMergeItem, targetMergeItem)) {
            selectMergeItem.ShowHoldOnEffect(targetMergeItem);
            return;
        }
        selectMergeItem.HideHoldOnEffect();
    }

    private CanActOn(selectMergeItem: MergeItem, targetMergeItem: MergeItem): boolean {
        if (selectMergeItem.HasCom(CoverCom)) {
            return false;
        }
        const targetCover = targetMergeItem.GetCom(CoverCom);
        if (targetCover != null && targetCover.coverType !== CoverType.cobweb) {
            return false;
        }
        const targetProduce = targetMergeItem.GetCom(ProduceCom);
        if (targetProduce != null && (targetMergeItem.data?.RequiredItemLength ?? 0) > targetProduce.hasRequires.length) {
            for (let i = (targetMergeItem.data?.RequiredItemLength ?? 0) - 1; i >= 0; --i) {
                const requireId = targetMergeItem.data!.RequiredItem(i);
                if (selectMergeItem.itemId === requireId && !targetProduce.hasRequires.includes(requireId)) {
                    return true;
                }
            }
        }
        return selectMergeItem.HasCom(MergeCom) && targetMergeItem.HasCom(MergeCom) && selectMergeItem.itemId === targetMergeItem.itemId;
    }
}

export class PutDownItemLogic extends BaseLogic {
    public override Update(manager: MergeManager): void {
        const items = [...(manager.GetGroup(PutDownCMDGroup)?.GetItems() ?? [])];
        for (const item of items) {
            this.PutDown(item);
            item.RemoveCom(PutDownCMDCom);
        }
    }

    private PutDown(selectMergeItem: MergeItem): void {
        selectMergeItem.HideHoldOnEffect();
        if (!selectMergeItem.GetCom(PutDownCMDCom)?.effective) {
            this.GoBack(selectMergeItem);
            return;
        }
        const manager = selectMergeItem.manager;
        const selectPosCom = selectMergeItem.GetCom(PosCom);
        const rowCol = manager.GetRowCol(selectMergeItem.GetPosition().y, selectMergeItem.GetPosition().x);
        if (selectPosCom == null || rowCol == null || (selectPosCom.row === rowCol.y && selectPosCom.col === rowCol.x)) {
            this.GoBack(selectMergeItem);
            return;
        }
        if (manager.isNeedGuide && (manager.guideTo.y !== rowCol.y || manager.guideTo.x !== rowCol.x)) {
            this.GoBack(selectMergeItem);
            return;
        }
        const targetMergeItem = manager.GetMergeItemByRowCol(rowCol.y, rowCol.x);
        if (targetMergeItem == null) {
            this.Occupy(selectMergeItem, rowCol.y, rowCol.x);
            return;
        }
        if (targetMergeItem.HasCom(StackCom)) {
            this.GoBack(selectMergeItem);
            return;
        }
        const targetCover = targetMergeItem.GetCom(CoverCom);
        if (targetCover != null) {
            if (!selectMergeItem.HasCom(CoverCom) && targetCover.coverType === CoverType.cobweb && this.CanMerge(selectMergeItem, targetMergeItem)) {
                this.Merge(selectMergeItem, targetMergeItem);
            }
            else if (targetCover.coverType === CoverType.bubble) {
                this.Swap(selectMergeItem, targetMergeItem);
            }
            else {
                this.GoBack(selectMergeItem);
            }
            return;
        }
        if (this.TryRequire(selectMergeItem, targetMergeItem)) {
            return;
        }
        if (this.CanMerge(selectMergeItem, targetMergeItem)) {
            this.Merge(selectMergeItem, targetMergeItem);
            return;
        }
        this.Swap(selectMergeItem, targetMergeItem);
    }

    private Occupy(item: MergeItem, row: number, col: number): void {
        const posCom = item.GetCom(PosCom);
        if (posCom == null) {
            return;
        }
        item.manager.items[posCom.row][posCom.col] = null;
        item.manager.items[row][col] = item;
        posCom.row = row;
        posCom.col = col;
        item.ShowMoveAni(item.manager.GetGridCenterXY(row, col), 0.1);
    }

    private GoBack(item: MergeItem): void {
        const posCom = item.GetCom(PosCom);
        if (posCom != null) {
            item.ShowMoveAni(item.manager.GetGridCenterXY(posCom.row, posCom.col), 0.2);
        }
    }

    private Swap(item1: MergeItem, item2: MergeItem): void {
        const posCom1 = item1.GetCom(PosCom);
        const posCom2 = item2.GetCom(PosCom);
        if (posCom1 == null || posCom2 == null) {
            return;
        }
        item1.manager.items[posCom1.row][posCom1.col] = item2;
        item1.manager.items[posCom2.row][posCom2.col] = item1;
        const oldRow = posCom1.row;
        const oldCol = posCom1.col;
        posCom1.row = posCom2.row;
        posCom1.col = posCom2.col;
        posCom2.row = oldRow;
        posCom2.col = oldCol;
        item1.ShowMoveAni(item1.manager.GetGridCenterXY(posCom1.row, posCom1.col), 0.1);
        item2.ShowMoveAni(item2.manager.GetGridCenterXY(posCom2.row, posCom2.col), 0.2);
    }

    private CanMerge(item1: MergeItem, item2: MergeItem): boolean {
        return !item1.HasCom(CoverCom) && item1.HasCom(MergeCom) && item2.HasCom(MergeCom) && item1.itemId === item2.itemId;
    }

    private Merge(item1: MergeItem, item2: MergeItem): void {
        item1.manager.stepOverTag = true;
        const data = item1.manager.GetNextMergeItemData(item1.itemId);
        if (data == null) {
            this.GoBack(item1);
            return;
        }
        MergeMain.Instance?.OnMergeItem();
        const coverId = item2.GetCom(CoverCom)?.coverId ?? -1;
        const posCom = item2.GetCom(PosCom);
        if (posCom == null) {
            this.GoBack(item1);
            return;
        }
        const row = posCom.row;
        const col = posCom.col;
        const manager = item1.manager;
        const newItem = manager.CreateMergeItem(data);
        newItem.AddCom(SelectCMDCom).needRefreshDetails = true;
        manager.RemoveMergeItem(item1);
        manager.RemoveMergeItem(item2);
        manager.items[row][col] = newItem;
        const newPosCom = newItem.GetCom(PosCom)!;
        newPosCom.row = row;
        newPosCom.col = col;
        newItem.InitItemView();
        if (coverId !== -1) {
            newItem.ShowCoverBreakEffect(coverId);
        }
        MergeMain.Instance?.GenOneMergeItem(newItem.itemId);
        manager.ChangeGridColor(newItem);
        newItem.ShowCompose();
        newItem.ShowReleaseEffect();
    }

    private TryRequire(item1: MergeItem, item2: MergeItem): boolean {
        if (item1.HasCom(CoverCom) || !item2.HasCom(ProduceCom) || item2.data == null) {
            return false;
        }
        const produceCom = item2.GetCom(ProduceCom)!;
        if (produceCom.residueNum > 0 || produceCom.cdEndTimestamp > 0 || produceCom.hasRequires.length >= item2.data.RequiredItemLength) {
            return false;
        }
        for (let i = item2.data.RequiredItemLength - 1; i >= 0; --i) {
            const requiredId = item2.data.RequiredItem(i);
            if (item1.itemId === requiredId && !produceCom.hasRequires.includes(requiredId)) {
                produceCom.hasRequires.push(item1.itemId);
                item1.manager.RemoveMergeItem(item1);
                if (produceCom.hasRequires.length >= item2.data.RequiredItemLength) {
                    produceCom.hasRequires.length = 0;
                    produceCom.cdStartTimestamp = item1.manager.GetTime();
                    produceCom.cdEndTimestamp = produceCom.cdStartTimestamp + item2.data.CoolDownTime;
                    item2.RefreshProduceConer();
                }
                else {
                    item2.ShowRequireProgress(item2.data);
                }
                item1.manager.stepOverTag = true;
                return true;
            }
        }
        return false;
    }
}

export class ProduceItemLogic extends BaseLogic {
    private preRefreshProduceTime: number = 0;

    public override Update(manager: MergeManager): void {
        const nowTime = manager.GetTime();
        const needRefresh = nowTime - this.preRefreshProduceTime > 0;
        for (const item of manager.GetGroup(ProduceGroup)?.GetItems() ?? []) {
            const produceCom = item.GetCom(ProduceCom);
            if (produceCom == null || item.data == null) {
                continue;
            }
            if (produceCom.cdEndTimestamp > 0) {
                if (produceCom.cdEndTimestamp < nowTime) {
                    manager.ResetProduceCD(item);
                }
                else if (needRefresh) {
                    this.preRefreshProduceTime = nowTime;
                    item.RefreshProduceCD();
                }
            }
            else {
                this.RecoverProduce(item, nowTime);
                if (item.HasCom(ProduceCMDCom)) {
                    item.RemoveCom(ProduceCMDCom);
                    this.ProduceItem(item);
                }
            }
        }
    }

    private RecoverProduce(item: MergeItem, nowTime: number): void {
        const produceCom = item.GetCom(ProduceCom);
        if (produceCom == null || item.data == null || produceCom.autoRecoveryStartTimestamp <= 0 || nowTime - produceCom.autoRecoveryStartTimestamp < MergeConst.AutoRecoveryOneNumTime) {
            return;
        }
        const needAddNum = Math.floor((nowTime - produceCom.autoRecoveryStartTimestamp) / MergeConst.AutoRecoveryOneNumTime);
        produceCom.residueNum = Math.min(item.data.GernerateNumber, produceCom.residueNum + needAddNum);
        produceCom.autoRecoveryStartTimestamp = produceCom.residueNum === item.data.GernerateNumber ? 0 : produceCom.autoRecoveryStartTimestamp + MergeConst.AutoRecoveryOneNumTime * needAddNum;
    }

    private ProduceItem(item: MergeItem): void {
        const manager = item.manager;
        const produceCom = item.GetCom(ProduceCom);
        const posCom = item.GetCom(PosCom);
        const data = item.data;
        const empty = manager.GetEmptyGrid();
        if (produceCom == null || posCom == null || data == null) {
            return;
        }
        if (empty == null) {
            MergeMain.Instance?.NoEmptyGrid();
            return;
        }
        const energyNum = MergeMain.Instance?.GetEnergyValue() ?? 0;
        if (energyNum <= 0) {
            MergeMain.Instance?.ShowEnergyView();
            return;
        }
        const target = manager.isNeedGuide ? { x: 4, y: 3 } : empty;
        const result = manager.isNeedGuide ? 520101 : this.GetProduceResult(item);
        --produceCom.residueNum;
        if (data.RequiredItemLength === 0 && data.GenerateTimes === 0 && produceCom.autoRecoveryStartTimestamp === 0) {
            produceCom.autoRecoveryStartTimestamp = manager.GetTime();
        }
        produceCom.hasProduces.set(result, (produceCom.hasProduces.get(result) ?? 0) + 1);
        this.FlyItem(manager, result, posCom.row, posCom.col, target.y, target.x);
        MergeMain.Instance?.SubEnergyValue();
        if (energyNum === 2) {
            MergeMain.Instance?.GuideMergeProduceNoEnergy();
        }
        if (produceCom.residueNum === 0) {
            if (data.RequiredItemLength === 0) {
                produceCom.cdStartTimestamp = manager.GetTime();
                produceCom.cdEndTimestamp = manager.GetTime() + data.CoolDownTime;
            }
            if (data.GenerateTimes !== 0) {
                --produceCom.times;
                if (produceCom.times < 0) {
                    item.ShowDisappear();
                    manager.RemoveMergeItem(item, 0.15);
                    return;
                }
            }
            item.RefreshProduceConer();
        }
    }

    private GetProduceResult(item: MergeItem): number {
        const data = item.data!;
        const produceCom = item.GetCom(ProduceCom)!;
        let guaranteedId = 0;
        let guaranteedNum = 0;
        if (data.GenerateGuaranteedLength > 1) {
            guaranteedId = data.GenerateGuaranteed(0);
            guaranteedNum = data.GenerateGuaranteed(1);
        }
        const weight: Array<[number, number]> = [];
        for (let i = 0; i < data.GenerateIDLength; ++i) {
            const generateID = data.GenerateID(i);
            if (generateID === guaranteedId && (produceCom.hasProduces.get(generateID) ?? 0) >= guaranteedNum) {
                continue;
            }
            weight.push([generateID, data.GenerateWeight(i)]);
        }
        return MergeUtility.RandomByWeight(weight);
    }

    private FlyItem(manager: MergeManager, itemId: number, fromRow: number, fromCol: number, targetRow: number, targetCol: number): void {
        const newItem = manager.CreateMergeItem(itemId);
        manager.items[targetRow][targetCol] = newItem;
        const newPosCom = newItem.GetCom(PosCom)!;
        newPosCom.row = targetRow;
        newPosCom.col = targetCol;
        newItem.InitItemView();
        MergeMain.Instance?.GenOneMergeItem(newItem.itemId);
        newItem.ShowMoveAniFrom(manager.GetGridCenterXY(fromRow, fromCol), manager.GetGridCenterXY(targetRow, targetCol), 0.2, true);
        if (!newItem.HasCom(CoverCom) && (newItem.data?.RequiredItemLength ?? 0) > 0 && newItem.GetCom(ProduceCom)?.residueNum === 0) {
            MergeMain.Instance?.GuideMergeGenRequire();
        }
    }
}

export class CoverItemLogic extends BaseLogic {
    public override Update(manager: MergeManager): void {
        const nowTime = manager.GetTime();
        for (const item of [...(manager.GetGroup(CoverGroup)?.GetItems() ?? [])]) {
            const coverCom = item.GetCom(CoverCom);
            if (coverCom != null && coverCom.cdEndTimestamp > 0 && coverCom.cdEndTimestamp < nowTime) {
                manager.RemoveMergeItem(item);
            }
        }
    }
}

export class MergeHintLogic extends BaseLogic {
    private preRefreshTime: number = 0;

    public override Update(manager: MergeManager): void {
        if (manager.isNeedGuide || (manager.GetGroup(ClickCMDGroup)?.GetItems().length ?? 0) > 0 || (manager.GetGroup(HoldOnCMDGroup)?.GetItems().length ?? 0) > 0) {
            return;
        }
        const hintItems = manager.GetGroup(MergeHintCMDGroup)?.GetItems() ?? [];
        if (hintItems.length === 1) {
            hintItems[0].RemoveCom(MergeHintCMDCom);
            hintItems[0].HideMergeHint();
            return;
        }
        const now = Date.now() / 1000;
        if (now - this.preRefreshTime <= 5 || hintItems.length !== 0) {
            return;
        }
        this.preRefreshTime = now;
        const canMergeItems = [...(manager.GetGroup(CanMergeGroup)?.GetItems() ?? [])].filter((item) => !item.HasCom(CoverCom) || item.GetCom(CoverCom)?.coverType === CoverType.cobweb);
        for (let i = 0; i < canMergeItems.length - 1; i++) {
            if (canMergeItems[i].itemId === canMergeItems[i + 1].itemId && !(canMergeItems[i].HasCom(CoverCom) && canMergeItems[i + 1].HasCom(CoverCom))) {
                canMergeItems[i].AddCom(MergeHintCMDCom);
                canMergeItems[i + 1].AddCom(MergeHintCMDCom);
                canMergeItems[i].ShowMergeHint(canMergeItems[i + 1]);
                canMergeItems[i + 1].ShowMergeHint(canMergeItems[i]);
                return;
            }
        }
    }
}

export class SelectLogic extends BaseLogic {
    private preRefreshTime: number = 0;

    public override Update(manager: MergeManager): void {
        const items = manager.GetGroup(SelectCMDGroup)?.GetItems() ?? [];
        if (items.length === 0) {
            return;
        }
        const item = items[0];
        const selectCmdCom = item.GetCom(SelectCMDCom);
        if (selectCmdCom?.needRefreshDetails) {
            MergeMain.Instance?.ShowItemDetails(item);
            selectCmdCom.needRefreshDetails = false;
        }
        const now = Date.now() / 1000;
        if (now - this.preRefreshTime > 0.1) {
            this.preRefreshTime = now;
            const posCom = item.GetCom(PosCom);
            if (posCom != null) {
                const inGridPos = manager.GetGridCenterXY(posCom.row, posCom.col);
                if (!item.HasCom(MoveCMDCom) && Distance2(inGridPos, item.GetPosition()) <= 0.05) {
                    item.position = new Vector3(inGridPos.x, inGridPos.y, item.position.z);
                }
            }
        }
    }
}
