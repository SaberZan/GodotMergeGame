export interface IMergeItem {
    GetId(): number;
    GetItemId(): number;
}

export interface IProduceCom {
    GetResidueNum(): number;
    GetTimes(): number;
    GetCdStartTimestamp(): number;
    GetCdEndTimestamp(): number;
    GetAutoRecoveryStartTimestamp(): number;
    GetHasRequires(): number[];
    GetHasProduces(): Map<number, number> | Record<number, number>;
}

export interface ICoverCom {
    GetCoverId(): number;
    GetCdStartTimestamp(): number;
    GetCdEndTimestamp(): number;
}

export interface IStackCom {
    GetItems(): number[];
}

export interface IMergeGameData {
    GetLevel(): string;
    GetMergeItemNum(): number;
    GetItem(i: number, j: number): IMergeItem | null;
    GetProduce(id: number): IProduceCom | null;
    GetCover(id: number): ICoverCom | null;
    GetStack(id: number): IStackCom | null;
}

export class MergeRowGrid {
    public element: number[] = [];

    public constructor(element: number[] = []) {
        this.element = element;
    }

    public Element(index: number): number {
        return this.element[index] ?? 0;
    }

    public get ElementLength(): number {
        return this.element.length;
    }
}

export class MergeGridMap {
    public grids: MergeRowGrid[] = [];

    public constructor(grids: Array<MergeRowGrid | number[]> = []) {
        this.grids = grids.map((grid) => Array.isArray(grid) ? new MergeRowGrid(grid) : grid);
    }

    public Grids(index: number): MergeRowGrid | null {
        return this.grids[index] ?? null;
    }

    public get GridsLength(): number {
        return this.grids.length;
    }
}

export class MergeItemData {
    public ItemType: number = 0;
    public ItemID: number = 0;
    public LanguageID: number = 0;
    public SeriesLanguageID: number = 0;
    public PicturePath: string = "";
    public GeneratePicturePath: string = "";
    public GenerateTimes: number = 0;
    public RequiredItems: number[] = [];
    public GenerateIDs: number[] = [];
    public GenerateWeights: number[] = [];
    public GenerateGuaranteedValues: number[] = [];
    public GernerateNumber: number = 0;
    public CoolDownTime: number = 0;
    public AccelerateGold: number = 0;

    public constructor(data: Partial<MergeItemData> = {}) {
        Object.assign(this, data);
    }

    public RequiredItem(index: number): number {
        return this.RequiredItems[index] ?? 0;
    }

    public get RequiredItemLength(): number {
        return this.RequiredItems.length;
    }

    public GenerateID(index: number): number {
        return this.GenerateIDs[index] ?? 0;
    }

    public get GenerateIDLength(): number {
        return this.GenerateIDs.length;
    }

    public GenerateWeight(index: number): number {
        return this.GenerateWeights[index] ?? 0;
    }

    public get GenerateWeightLength(): number {
        return this.GenerateWeights.length;
    }

    public GenerateGuaranteed(index: number): number {
        return this.GenerateGuaranteedValues[index] ?? 0;
    }

    public get GenerateGuaranteedLength(): number {
        return this.GenerateGuaranteedValues.length;
    }
}

export class MergeUpgradeData {
    public ItemSeries: number = 0;
    public ItemLevel: number = 0;
    public ItemID: number = 0;
    public Probability: number = 0;
    public BubbleGold: number = 0;
    public CobwebGold: number = 0;
    public ItemSource: number = 0;

    public constructor(data: Partial<MergeUpgradeData> = {}) {
        Object.assign(this, data);
    }
}

export class UpgradeDataNode {
    public mergeUpgradeData: MergeUpgradeData;
    public NextDataNode: UpgradeDataNode | null = null;

    public constructor(mergeUpgradeData: MergeUpgradeData) {
        this.mergeUpgradeData = mergeUpgradeData;
    }
}

