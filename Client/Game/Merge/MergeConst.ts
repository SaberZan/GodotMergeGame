export enum PieceItemType {
    Produce = 1,
    Normal = 2,
    Tool = 3,
}

export class MergeConst {
    public static readonly MaxCol: number = 9;
    public static readonly MaxRow: number = 7;
    public static readonly mergeBoxId: number = Math.floor(2147483647 / 10);
    public static CellWidth: number = 0.9702;
    public static CellHeight: number = -0.9702;
    public static OffSetX: number = -4.028743;
    public static OffSetY: number = 2.868096;
    public static readonly AutoRecoveryOneNumTime: number = 30;
    public static readonly BubbleTime: number = 120;
}

