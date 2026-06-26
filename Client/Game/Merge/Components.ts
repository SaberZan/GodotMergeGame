import type { ICoverCom, IProduceCom, IStackCom } from "./Data";

export type MergeComConstructor<T extends BaseCom = BaseCom> = new () => T;

export class BaseCom {
    public Reset(): void {
    }
}

export interface ISerializeCom {
    DeSerialize(data: unknown): void;
    Serialize(): unknown;
}

export class PosCom extends BaseCom {
    public row: number = 0;
    public col: number = 0;

    public override Reset(): void {
        this.row = 0;
        this.col = 0;
    }
}

export enum CoverType {
    cobweb,
    paperBox,
    bubble,
}

export class CoverCom extends BaseCom implements ISerializeCom {
    public coverId: number = 0;
    public cdStartTimestamp: number = 0;
    public cdEndTimestamp: number = 0;

    public get coverType(): CoverType {
        if (this.coverId === 1) {
            return CoverType.cobweb;
        }
        if (this.coverId === 2 || this.coverId === 3) {
            return CoverType.paperBox;
        }
        if (this.coverId === 4) {
            return CoverType.bubble;
        }
        return CoverType.cobweb;
    }

    public override Reset(): void {
        this.coverId = 0;
        this.cdStartTimestamp = 0;
        this.cdEndTimestamp = 0;
    }

    public DeSerialize(data: unknown): void {
        const coverCom = data as ICoverCom;
        this.coverId = coverCom.GetCoverId();
        this.cdStartTimestamp = coverCom.GetCdStartTimestamp();
        this.cdEndTimestamp = coverCom.GetCdEndTimestamp();
    }

    public Serialize(): unknown {
        return {
            coverId: this.coverId,
            cdStartTimestamp: this.cdStartTimestamp,
            cdEndTimestamp: this.cdEndTimestamp,
        };
    }
}

export class ProduceCom extends BaseCom implements ISerializeCom {
    public cdStartTimestamp: number = 0;
    public cdEndTimestamp: number = 0;
    public autoRecoveryStartTimestamp: number = 0;
    public residueNum: number = 0;
    public times: number = 0;
    public hasRequires: number[] = [];
    public hasProduces: Map<number, number> = new Map<number, number>();

    public override Reset(): void {
        this.residueNum = 0;
        this.times = 0;
        this.cdStartTimestamp = 0;
        this.cdEndTimestamp = 0;
        this.autoRecoveryStartTimestamp = 0;
        this.hasRequires.length = 0;
        this.hasProduces.clear();
    }

    public DeSerialize(data: unknown): void {
        const produceCom = data as IProduceCom;
        this.times = produceCom.GetTimes();
        this.residueNum = produceCom.GetResidueNum();
        this.cdStartTimestamp = produceCom.GetCdStartTimestamp();
        this.cdEndTimestamp = produceCom.GetCdEndTimestamp();
        this.autoRecoveryStartTimestamp = produceCom.GetAutoRecoveryStartTimestamp();
        this.hasRequires = [...produceCom.GetHasRequires()];
        const hasProduces = produceCom.GetHasProduces();
        this.hasProduces = hasProduces instanceof Map ? new Map(hasProduces) : new Map(Object.entries(hasProduces).map(([key, value]) => [Number(key), value]));
    }

    public Serialize(): unknown {
        return {
            cdStartTimestamp: this.cdStartTimestamp,
            cdEndTimestamp: this.cdEndTimestamp,
            autoRecoveryStartTimestamp: this.autoRecoveryStartTimestamp,
            residueNum: this.residueNum,
            times: this.times,
            hasRequires: [...this.hasRequires],
            hasProduces: Object.fromEntries(this.hasProduces),
        };
    }
}

export class StackCom extends BaseCom implements ISerializeCom {
    public cache: number[] = [];
    public items: number[] = [];

    public override Reset(): void {
        this.cache.length = 0;
        this.items.length = 0;
    }

    public DeSerialize(data: unknown): void {
        const stackCom = data as IStackCom;
        const datas = stackCom.GetItems();
        for (let i = datas.length - 1; i >= 0; --i) {
            this.items.push(datas[i]);
        }
    }

    public Serialize(): unknown {
        return {
            items: [...this.items].reverse(),
            cache: [...this.cache],
        };
    }

    public Push(itemId: number): void {
        this.items.push(itemId);
    }

    public Pop(): number | undefined {
        return this.items.pop();
    }

    public Peek(): number | undefined {
        return this.items[this.items.length - 1];
    }
}

export class MergeCom extends BaseCom {
}

export class ToolCom extends BaseCom {
}

export class ClickCMDCom extends BaseCom {
}

export class DeleteCMDCom extends BaseCom {
}

export class HoldOnCMDCom extends BaseCom {
}

export class MergeHintCMDCom extends BaseCom {
}

export class MoveCMDCom extends BaseCom {
}

export class ProduceCMDCom extends BaseCom {
}

export class PutDownCMDCom extends BaseCom {
    public effective: boolean = false;

    public override Reset(): void {
        this.effective = false;
    }
}

export class SelectCMDCom extends BaseCom {
    public needRefreshDetails: boolean = false;

    public override Reset(): void {
        this.needRefreshDetails = false;
    }
}

