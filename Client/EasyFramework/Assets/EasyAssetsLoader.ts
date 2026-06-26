
/// <summary>
/// 资源管理类
/// 管理资源加载和释放；
/// 并且管理ab包， 及其ab包内加载资源。

import { DirAccess, FileAccess, OS, PackedByteArray, Resource } from "godot";
import EasyAssetBundle from "./AssetBundle/EasyAssetBundle";
import Catalogs from "./Catalogs";
import BaseAssetHandle from "./AssetHandle/BaseAssetHandle";
import { DownloadCtrl } from "./DownloadCtrl";
import { Const, EasyAssetBundleType } from "./Const";
import { EasyAssetConfig } from "./EasyAssetConfig";
import BaseGodotAssetHandle from "./AssetHandle/BaseGodotAssetHandle";
import GodotAssetBundle from "./AssetBundle/GodotAssetBundle";
import { RawAssetBundle } from "./AssetBundle/RawAssetBundle";
import EasyAssetBundleInfo from "./AssetInfo/EasyAssetBundleInfo";
import { SingleGodotAssetHandle } from "./AssetHandle/SingleGodotAssetHandle";
import { MultiGodotAssetHandle } from "./AssetHandle/MultiGodotAssetHandle";
import { SingleRawAssetHandle } from "./AssetHandle/SingleRawAssetHandle";
import MultiRawAssetHandle from "./AssetHandle/MultiRawAssetHandle";
import { LoggerMgr } from "../Logger/LoggerMgr";

type ResourceType<T extends Resource = Resource> = { new(identifier?: any): T };

/// </summary>
export default class EasyAssetsLoader {
    /// <summary>
    /// 所有资源信息类对象l
    /// </summary>
    public catalogs: Catalogs = new Catalogs();

    /// <summary>
    /// ab包缓冲字典
    /// </summary>
    private _assetBundlesCache: { [key: number]: EasyAssetBundle } = {};

    /// <summary>
    /// ab包的引用计数
    /// </summary>
    private _assetBundlesReference: { [key: number]: number } = {};

    /// <summary>
    /// 持有的handle
    /// </summary>
    private _handles: BaseAssetHandle[] = [];

    /// <summary>
    /// handle的缓存池
    /// </summary>
    private _handleCache: { [key: string]: BaseAssetHandle[] } = {};

    /// <summary>
    /// 初始化成功回调
    /// </summary>
    private _initComplete: Function | undefined;

    /// <summary>
    /// 进度
    /// </summary>
    private _progress: number = 0;

    /// <summary>
    /// 热更下载,必须下载完必要包,才会生效
    /// </summary>
    private _abDownloadCtrl: DownloadCtrl | undefined;

    /// <summary>
    /// 资源配置
    /// </summary>
    private easyAssetConfig!: EasyAssetConfig;
    /// <summary>
    /// 资源配置
    /// </summary>
    public get EasyAssetConfig() { return this.easyAssetConfig; }


    /// <summary>
    /// 重新启动接口
    /// </summary>
    public BeforeRestart() {
        for (let key in this._assetBundlesCache) {
            this._assetBundlesCache[key].Unload(true);
        }
        this._abDownloadCtrl?.Reset();
    }

    /// <summary>
    /// 初始化接口
    /// </summary>
    /// <param name="complete"></param>
    public async Init(...args: any[]): Promise<boolean> {
        let assetCfg = FileAccess.get_file_as_string("res://gen/easy_config/EasyAssetConfig.json");
        this.easyAssetConfig = JSON.parse(assetCfg);
        BaseGodotAssetHandle.instanceOverTime = this.easyAssetConfig.instanceOverTime;

        let process: Function[] = [];
        var downloadResult = await this.CheckDownload();
        var catalogsResult = await this.LoadLocalCatalogs();
        return downloadResult && catalogsResult;
    }

    /// <summary>
    /// 检测下载
    /// </summary>
    /// <param name="complete"></param>
    private async CheckDownload() : Promise<boolean> {
        this._abDownloadCtrl = new DownloadCtrl();
        return this._abDownloadCtrl.CheckUpdate(this);
    }

    /// <summary>
    /// 加载本地资源详情
    /// </summary>
    /// <param name="complete"></param>
    private async LoadLocalCatalogs() : Promise<boolean> {
        this.catalogs = Catalogs.FromJson(FileAccess.open(Const.localVersionPath, FileAccess.ModeFlags.READ)?.get_as_text() ?? "{}");
        this._progress = 1;
        return true;
    }

    /// <summary>
    /// 定时刷新
    /// </summary>    
    public Update() {
        for (let i = this._handles.length - 1; i >= 0; --i) {
            if (this._handles[i] instanceof BaseGodotAssetHandle) {
                if (this.TryReleaseAssetHandle(this._handles[i])) {
                    this.PutHandleToCache(this._handles[i]);
                    this._handles.slice(i, 1);
                }
            }
        }
    }

    private GetEasyAssetBundle(assetName: string): EasyAssetBundle | undefined {
        let easyAssetInfo = this.catalogs.GetEasyAssetInfoByAsset(assetName);
        if (easyAssetInfo?.asset.localeCompare(assetName, undefined, { sensitivity: 'base' }) === 0) {
            let needABIndexes = easyAssetInfo.needABIndexes;
            for (let j = 0; j < needABIndexes.length; ++j) {
                this.LoadAssetBundleByIndex(needABIndexes[j]);
            }
            if (this._assetBundlesCache[easyAssetInfo.abIndex]) {
                return this._assetBundlesCache[easyAssetInfo.abIndex];
            }
        }
        return undefined;
    }

    /// <summary>
    /// 加载ab包
    /// </summary>
    /// <param name="index">ab包序号</param>
    /// <param name="action">回调方法</param>
    private LoadAssetBundleByIndex(index: number, action?: Function): boolean {
        if (this._assetBundlesCache[index])
            return false;
        let assetBundle = null;
        let abInfo = this.catalogs.allEasyAssetBundleInfos[index];
        if (abInfo.easyAssetBundleType == EasyAssetBundleType.GodotAssetBundle) {
            assetBundle = new GodotAssetBundle(this, index);
        }
        else if (abInfo.easyAssetBundleType == EasyAssetBundleType.RawAssetBundle) {
            assetBundle = new RawAssetBundle(this, index);
        }
        if (assetBundle == null)
            return false;
        this._assetBundlesCache[index] = assetBundle;
        action?.call(action.caller);
        return true;
    }


    /// <summary>
    /// 检测某个资源包是否全都准备好
    /// </summary>
    /// <param name="packageName"></param>
    /// <returns></returns>
    public CheckPackageCompleted(packageName: string): boolean {
        for (let i = 0, abCount = this.catalogs.allEasyAssetBundleInfos.length; i < abCount; i++) {
            if (this.catalogs.allEasyAssetBundleInfos[i].packages.indexOf(packageName) != -1 && !this.CheckEasyAssetBundleCompleted(i)) {
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// 开始下载资源包
    /// </summary>
    /// <param name="packageName"></param>
    public StartDownloadPackage(packageName: string) {
        for (let i = 0, abCount = this.catalogs.allEasyAssetBundleInfos.length; i < abCount; i++) {
            if (this.catalogs.allEasyAssetBundleInfos[i].packages.indexOf(packageName) != -1 && !this.CheckEasyAssetBundleCompleted(i)) {
                this.StartDownloadEasyAssetBundle(i);
            }
        }
    }

    /// <summary>
    /// 检测ab包是否下载好
    /// </summary>
    /// <param name="abIndex"></param>
    /// <returns></returns>
    public CheckEasyAssetBundleCompleted(abIndex: number): boolean {
        if (OS.has_feature("editor")) {
            return true;
        }
        let easyAssetBundleInfo = this.catalogs.allEasyAssetBundleInfos[abIndex];
        const pckPath = Const.localAssetBundleFolder + easyAssetBundleInfo.md5 + ".pck";
        const legacyPath = Const.localAssetBundleFolder + easyAssetBundleInfo.md5;
        const filePath = FileAccess.file_exists(pckPath) ? pckPath : legacyPath;
        let exist = FileAccess.file_exists(filePath);
        if(!exist)
            return false;
        let md5 = FileAccess.get_md5(filePath)
        if(md5 != easyAssetBundleInfo.md5)
            return false;
        return true;
    }

    /// <summary>
    /// 开始下载ab包
    /// </summary>
    /// <param name="abIndex"></param>
    public StartDownloadEasyAssetBundle(abIndex: number) {
        let abInfo: EasyAssetBundleInfo = this.catalogs.allEasyAssetBundleInfos[abIndex];
        this._abDownloadCtrl?.StartDownload(abInfo.md5);
    }

    /// <summary>
    /// 是否下载失败
    /// </summary>
    /// <returns></returns>
    public IsDownLoadFail(): boolean {
        return this._abDownloadCtrl?.IsDownLoadFail() ?? false;
    }


    /// <summary>
    /// 加载资源
    /// </summary>
    /// <param name="assetName"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public LoadGodotAssetAtPath<T extends Resource>(assetName: string, type: ResourceType<T>): T | undefined {
        if (this.GetEasyAssetBundle(assetName) as GodotAssetBundle) {
            return this.GetEasyAssetBundle(assetName)?.LoadAsset<T>(assetName, type) ?? undefined;
        }
        return undefined;
    }

    /// <summary>
    /// 加载资源
    /// </summary>
    /// <param name="assetName"></param>
    /// <returns></returns>
    public LoadRawAssetAtPath(assetName: string): PackedByteArray | null {
        if (this.GetEasyAssetBundle(assetName) instanceof RawAssetBundle) {
            return this.GetEasyAssetBundle(assetName)?.LoadRawAsset(assetName) ?? null;
        }
        return null;
    }

    /// <summary>
    /// 加载单资源
    /// </summary>
    /// <param name="path"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public LoadGodotAsset<T extends Resource>(path: string, type: ResourceType<T>): SingleGodotAssetHandle<T> {
        let handle = this.GetHandleFromCache<SingleGodotAssetHandle<T>>(SingleGodotAssetHandle<T>, type);
        handle.loader = this;
        handle.path = path;
        handle.dependAB = this.catalogs.GetDependEasyAssetBundleIndexesByAssetName(path) ?? [];
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 加载多资源
    /// </summary>
    /// <param name="key"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public LoadGodotAssetsByKey<T extends Resource>(key: string, type: ResourceType<T>): MultiGodotAssetHandle {
        let handle = this.GetHandleFromCache<MultiGodotAssetHandle>(MultiGodotAssetHandle);
        handle.loader = this;
        let depends: number[] = [];

        let keyLen = key.length;
        for (var dicKey in this.catalogs.allActiveEasyAssetInfoDic) {
            if (parseInt(dicKey) < keyLen) {
                continue;
            }
            let dic = this.catalogs.allActiveEasyAssetInfoDic[dicKey];
            for (var assetInfoKey in dic) {
                if (assetInfoKey.toLowerCase().indexOf(key.toLowerCase()) < 0) {
                    continue;
                }
                var easyAssetInfo = dic[assetInfoKey];
                var tempType = this.catalogs.GetTypeByAssetTypeIndex(easyAssetInfo.typeIndex);
                if (!this.IsSameOrDerivedResourceType(tempType, type)) {
                    continue;
                }
                handle.paths.push(easyAssetInfo.asset);
                depends.concat(easyAssetInfo.needABIndexes);
            }
        }
        handle.dependAB = Array.from(new Set(handle.dependAB));
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 加载多资源
    /// </summary>
    /// <param name="paths"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public LoadGodotAssetsByPaths<T extends Resource>(paths: string[], type: ResourceType<T> | null): MultiGodotAssetHandle {
        let handle = this.GetHandleFromCache<MultiGodotAssetHandle>(MultiGodotAssetHandle);
        handle.loader = this;
        let depends: number[] = [];
        for (let path of paths) {
            var assetType = this.catalogs.GetTypeByAssetName(path);
            if (this.IsSameOrDerivedResourceType(assetType, type)) {
                handle.paths.push(path);
                depends.concat(this.catalogs.GetDependEasyAssetBundleIndexesByAssetName(path) ?? []);
            }
        }
        handle.dependAB = Array.from(new Set(handle.dependAB));
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 加载原始资源
    /// </summary>
    /// <param name="path"></param>
    /// <returns></returns>
    public LoadRawAsset(path: string): SingleRawAssetHandle {
        let handle = this.GetHandleFromCache<SingleRawAssetHandle>(SingleRawAssetHandle);
        handle.loader = this;
        handle.path = path;
        handle.dependAB.concat(this.catalogs.GetDependEasyAssetBundleIndexesByAssetName(path) ?? []);
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 通过key加载原始资源
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    public LoadRawAssetsByKey(key: string): MultiRawAssetHandle {
        let handle = this.GetHandleFromCache<MultiRawAssetHandle>(MultiRawAssetHandle);
        handle.loader = this;
        let depends: number[] = [];

        let keyLen = key.length;
        for (let dicKey in this.catalogs.allActiveEasyAssetInfoDic) {
            if (parseInt(dicKey) < keyLen) {
                continue;
            }
            let dic = this.catalogs.allActiveEasyAssetInfoDic[dicKey];
            for (var assetInfoKey in dic) {
                if (assetInfoKey.toLowerCase().indexOf(key.toLowerCase()) < 0) {
                    continue;
                }
                var easyAssetInfo = dic[assetInfoKey];
                handle.paths.push(easyAssetInfo.asset);
                depends.concat(easyAssetInfo.needABIndexes);
            }
        }
        handle.dependAB = Array.from(new Set(handle.dependAB));
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 加载多原始资源
    /// </summary>
    /// <param name="paths"></param>
    /// <returns></returns>
    public LoadRawAssetsByPaths(paths: string[]): MultiRawAssetHandle {
        let handle = this.GetHandleFromCache<MultiRawAssetHandle>(MultiRawAssetHandle);
        handle.loader = this;
        let depends: number[] = [];
        for (let path of paths) {
            handle.paths.push(path);
            depends.concat(this.catalogs.GetDependEasyAssetBundleIndexesByAssetName(path) ?? []);
        }
        handle.dependAB = Array.from(new Set(handle.dependAB));
        this._handles.push(handle);
        this.RetainHandle(handle);
        handle.Start();
        return handle;
    }

    /// <summary>
    /// 从缓存中拿handle句柄
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <returns></returns>
    private GetHandleFromCache<T extends BaseAssetHandle>(type: { new(identifier?: any): T, resourceType?: Resource }, resourceType?: ResourceType): T {
        let key = resourceType ? type.name +  resourceType.name : type.name;
        console.log("--------GetHandleFromCache----------key ===" + key)
        if (this._handleCache[key] && this._handleCache[key].length > 0) {
            let handle = this._handleCache[key].pop();
            if (handle) {
                handle.Reuse();
                return <T>handle;
            }
        }
        if (resourceType) {
            return new type(resourceType);
        }
        return new type();
    }

    private IsSameOrDerivedResourceType(assetType: unknown, type: unknown): boolean {
        if (type == null) {
            return true;
        }
        if (assetType == null) {
            return false;
        }
        if (assetType == type) {
            return true;
        }
        if (typeof assetType != "function" || typeof type != "function") {
            return false;
        }

        let currentType = Object.getPrototypeOf(assetType);
        while (currentType != null) {
            if (currentType == type) {
                return true;
            }
            currentType = Object.getPrototypeOf(currentType);
        }
        return false;
    }

    /// <summary>
    /// 将无用句柄缓存
    /// </summary>
    /// <param name="handle"></param>
    private PutHandleToCache(handle: BaseAssetHandle) {
        let type = typeof (handle);
        if (!this._handleCache[type]) {
            this._handleCache[type] = [];
        }
        handle.Reset();
        this._handleCache[type].push(handle);
    }

    /// <summary>
    /// 对ab包添加引用计数,不针对Load出来的资源进行引用计数，当ab包引用计数为0时，释放ab包和Load出来的资源
    /// </summary>
    private RetainHandle(handle: BaseAssetHandle) {
        if (handle instanceof BaseAssetHandle) {
            for (var abName of handle.dependAB) {
                if (!this._assetBundlesReference[abName])
                    this._assetBundlesReference[abName] = 0;
                ++this._assetBundlesReference[abName];
            }
        }
    }

    /// <summary>
    /// 尝试释放handle
    /// </summary>
    /// <param name="handle"></param>
    /// <returns></returns>
    private TryReleaseAssetHandle(handle: BaseAssetHandle): boolean {
        if (handle instanceof BaseGodotAssetHandle && handle.AliveCount() > 0) {
            LoggerMgr.Instance().Log("EasyFrameWork", "实例还没被销毁,不应删除句柄");
            return false;
        }
        for (var abName of handle.dependAB) {
            if (!this._assetBundlesReference[abName])
                this._assetBundlesReference[abName] = 0;
            --this._assetBundlesReference[abName];
        }
        return true;
    }

    /// <summary>
    /// 对ab包减少引用计数,不针对Load出来的资源进行引用计数，当ab包引用计数为0时，释放ab包和Load出来的资源
    /// </summary>
    public ReleaseHandle(handle: BaseAssetHandle): boolean {
        if (handle instanceof BaseAssetHandle) {
            if (this.TryReleaseAssetHandle(handle)) {
                this.PutHandleToCache(handle);
                this._handles = this._handles.filter(x => x != handle);
                return true;
            }
        }
        else {
            this.PutHandleToCache(handle);
            this._handles = this._handles.filter(x => x != handle);
            return true;
        }
        return false;
    }

    /// <summary>
    /// 卸载未使用资源
    /// </summary>
    public UnloadUnusedAssets() {
        for (let key in this._assetBundlesReference) {
            if (this._assetBundlesReference[key] == 0) {
                this._assetBundlesCache[key].Unload(true);
                delete this._assetBundlesCache[key];
            }
        }
    }

    /// <summary>
    /// 获得更新进度
    /// </summary>
    /// <returns></returns>
    public GetUpdateProgress(): number {
        return this._progress;
    }

    /// <summary>
    /// 是否强更新
    /// </summary>
    /// <returns></returns>
    public NeedForeUpdate(): boolean {
        return this._abDownloadCtrl?.NeedForeUpdate() == true;
    }
}
