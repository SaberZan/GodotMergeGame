
/// <summary>
/// 每一个ab包的信息

import { DownloadPriority, EasyAssetBundleType, Location } from "../Const";

/// </summary>
export default class EasyAssetBundleInfo {
    /// <summary>
    /// ab包种类
    /// </summary>
    public easyAssetBundleType: EasyAssetBundleType = EasyAssetBundleType.RawAssetBundle;

    /// <summary>
    /// AB包名
    /// </summary>
    public abName: string = "";

    /// <summary>
    /// md5
    /// </summary>
    public md5: string = "";

    /// <summary>
    /// AB包大小
    /// </summary>
    public size: number = 0;

    /// <summary>
    /// crc标志
    /// </summary>
    public crc: number = 0;

    /// <summary>
    /// 被什么Package使用
    /// </summary>
    public packages: string[] = [];

    /// <summary>
    /// ab包位置
    /// </summary>
    public location: Location = Location.InStreamAsset;

    /// <summary>
    /// 是否加密
    /// </summary>
    public isEncrypt: boolean = false;

    /// <summary>
    /// 是否启动必须有
    /// </summary>
    public abDownloadPriority: DownloadPriority = DownloadPriority.Must;

    public EasyAssetBundleInfo() {

    }
}