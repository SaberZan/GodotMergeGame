import { Node } from "godot";
import type { MergeItemData } from "./Data";
import type { MergeItem } from "./MergeItem";

export class MergeDragItem extends Node {
    public onBeginDrag: (() => void) | null = null;
    public onDrag: ((pos: unknown) => void) | null = null;
    public onEndDrag: (() => void) | null = null;
    public onCancelDrag: (() => void) | null = null;
    public onTap: (() => void) | null = null;

    public ShowClick(): void {
    }
}

export class MergeItemView extends MergeDragItem {
    public InitView(_item: MergeItem, _mergeItemData: MergeItemData): void {}
    public InitIcon(_mergeItemData: MergeItemData): void {}
    public InitProduceView(_item: MergeItem, _mergeItemData: MergeItemData): void {}
    public ShowCDProgress(_item: MergeItem, _mergeItemData: MergeItemData): void {}
    public ShowRequireProgress(_item: MergeItem, _mergeItemData: MergeItemData, _time: number = 0.1): void {}
    public ShowMoveAni(_item: MergeItem, _targetPos: unknown, _time: number, _bazier: boolean = false, callBack: (() => void) | null = null): void { callBack?.(); }
    public HideMoveAni(): void {}
    public RemoveView(): void {}
}

export class MergeBoxView extends MergeDragItem {
    public InitView(_item: MergeItem): void {}
    public ShowOpen(): void {}
    public ShowClose(): void {}
    public ShowIcon(_mergeItemData: MergeItemData): void {}
    public ShowNum(_num: number): void {}
    public RemoveView(): void {}
}

export class MergeGridView extends Node {
    public Init(_row: number, _col: number): void {}
    public ShowHighLight(): void {}
    public FadeHighLight(): void {}
}

export class MergeTips extends Node {
    public ShowFurnitures(_showPictures: string[], _isTop: boolean): void {}
    public Hide(): void {}
}

export class MergeConerClock extends Node {
    public ShowProgress(_value: number): void {}
}

export class MergeConerRequire extends Node {
    public ShowProgressAni(_requiredLength: number, _targetValue: number, _time: number, callback: (() => void) | null = null): void { callback?.(); }
}

