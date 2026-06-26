
/// <summary>
/// 资源信息
/// </summary>
export default class EasyAssetInfo {
    /// <summary>
    /// 资源名
    /// </summary>
    public asset: string = "";

    /// <summary>
    /// Godot 资源 UID
    /// </summary>
    public uid: string = "";

    /// <summary>
    /// 属于哪个ab包
    /// </summary>
    public abIndex: number = -1;

    /// <summary>
    /// 依赖了哪些ab包
    /// </summary>
    public needABIndexes: number[] = [];

    /// <summary>
    /// 资源类型
    /// </summary>
    public typeIndex: number = -1;

    /// <summary>
    /// 修改时间标签
    /// </summary>
    public changeTag: number = -1;

    /// <summary>
    /// 是否是原始资源
    /// </summary>
    public isRaw: boolean = false;

    /// <summary>
    /// 偏移量
    /// </summary>
    public offset: number = 0;

    /// <summary>
    /// 大小
    /// </summary>
    public size: number = 0;


}
