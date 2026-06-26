import type { MergeItem } from "./MergeItem";
import {
    ClickCMDCom,
    CoverCom,
    DeleteCMDCom,
    HoldOnCMDCom,
    MergeCom,
    MergeHintCMDCom,
    MoveCMDCom,
    PosCom,
    ProduceCom,
    PutDownCMDCom,
    SelectCMDCom,
    StackCom,
} from "./Components";
import type { MergeComConstructor } from "./Components";

export class BaseGroup {
    private readonly items: Set<MergeItem> = new Set<MergeItem>();
    private itemArray: MergeItem[] = [];
    private isChanged: boolean = false;

    public get include(): MergeComConstructor[] {
        return [];
    }

    public get fitter(): MergeComConstructor[] {
        return [];
    }

    public Match(item: MergeItem): void {
        for (const type of this.include) {
            if (!item.HasCom(type.name)) {
                this.RemoveItem(item);
                return;
            }
        }
        for (const type of this.fitter) {
            if (item.HasCom(type.name)) {
                this.RemoveItem(item);
                return;
            }
        }
        if (!this.items.has(item)) {
            this.items.add(item);
            this.isChanged = true;
        }
    }

    public GetItems(): MergeItem[] {
        if (this.isChanged) {
            this.itemArray = Array.from(this.items);
            this.isChanged = false;
        }
        return this.itemArray;
    }

    private RemoveItem(item: MergeItem): void {
        if (this.items.delete(item)) {
            this.isChanged = true;
        }
    }
}

export class CanMergeGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, MergeCom];
    }

    public override get fitter(): MergeComConstructor[] {
        return [DeleteCMDCom, MoveCMDCom];
    }
}

export class ClickCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, ClickCMDCom];
    }
}

export class CoverGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, CoverCom];
    }
}

export class DeleteCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, DeleteCMDCom];
    }
}

export class HoldOnCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, HoldOnCMDCom];
    }
}

export class MergeHintCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, MergeHintCMDCom];
    }

    public override get fitter(): MergeComConstructor[] {
        return [DeleteCMDCom];
    }
}

export class NoCoverGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom];
    }

    public override get fitter(): MergeComConstructor[] {
        return [CoverCom, StackCom, DeleteCMDCom];
    }
}

export class ProduceGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, ProduceCom];
    }

    public override get fitter(): MergeComConstructor[] {
        return [CoverCom];
    }
}

export class PutDownCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, PutDownCMDCom];
    }
}

export class SelectCMDGroup extends BaseGroup {
    public override get include(): MergeComConstructor[] {
        return [PosCom, SelectCMDCom];
    }

    public override get fitter(): MergeComConstructor[] {
        return [DeleteCMDCom];
    }
}

