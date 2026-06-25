
export class Const {
    /// <summary>
    /// 原始版本存放路径
    /// </summary>
    public static originalVersionPath: string = "res://gen/catalogs.json";

    /// <summary>
    /// PAD存放路径
    /// </summary>
    public static originalPlayAssetPackPath: string = "res://AssetBundles/playAssetPackConfig.json";

    /// <summary>
    /// 本地版本存放路径 
    /// </summary>
    public static localVersionPath: string = "res://AssetBundles/catalogs.json";

    /// <summary>
    /// 原始ab包存放路径
    /// </summary>
    public static originAssetBundleFolder: string = "res://AssetBundles/";

    /// <summary>
    /// 本地ab包存放路径
    /// </summary>
    public static localAssetBundleFolder: string = "res://AssetBundles/";
    /// <summary>
    /// DLC 下载完成
    /// </summary>
    public static DOWNLOAD_SUCCESS: string = "AB_DOWNLOAD_SUCCESS";

    /// <summary>
    /// DLC 下载失败
    /// </summary>
    public static DOWNLOAD_FAIL: string = "AB_DOWNLOAD_FAIL";
}

/// <summary>
/// ab包下载优先级
/// </summary>
export enum DownloadPriority {
    //必须被下载
    Must,
    //优先被下载
    High,
    //调用了才被下载
    Low
}

/// <summary>
/// ab包下载中的情况
/// </summary>
export enum DownloadType {
    //下载未开始
    NoStart,
    //开始下载
    Start,
    //下载过程中
    InProgress,
    //下载完成
    Complete,
    //下载失败
    Fail,
}

/// <summary>
/// 包所在位置
/// </summary>
export enum Location {
    InStreamAsset,
    InServer,
}

/// <summary>
/// ab包类型
/// </summary>
export enum EasyAssetBundleType {
    GodotAssetBundle,
    RawAssetBundle,
}