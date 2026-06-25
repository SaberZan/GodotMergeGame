
/// <summary>
/// 句柄基类

import { MessageMgr } from "../../Message/MessageMgr";
import { Const } from "../Const";
import EasyAssetsLoader from "../EasyAssetsLoader";

/// </summary>
export default class BaseAssetHandle {
    /// <summary>
    /// 资源加载器
    /// </summary>
    public loader: EasyAssetsLoader | undefined;

    /// <summary>
    /// 加载的资源依赖了哪些ab
    /// </summary>
    /// <typeparam name="int"></typeparam>
    /// <returns></returns>
    public dependAB: number[] = [];

    /// <summary>
    /// 是否已加载完成
    /// </summary>
    public isDone: boolean = false;

    /// <summary>
    /// 是否加载失败
    /// </summary>
    public downloadFail: boolean = false;

    /// <summary>
    /// 这个句柄再缓冲池中的标记
    /// </summary>
    public isInPool: boolean = false;

    /// <summary>
    /// 实例超时
    /// </summary>
    public static instanceOverTime: number;

    /// <summary>
    /// 开始下载
    /// </summary>
    public Start() {
        for (let i = this.dependAB.length - 1; i >= 0; --i) {
            this.loader?.StartDownloadEasyAssetBundle(this.dependAB[i]);
        }
    }

    /// <summary>
    /// 是否下载完
    /// </summary>
    /// <returns></returns>
    public IsDone(): boolean {
        if (!this.isDone) {
            if (this.CheckComplete()) {
                this.isDone = true;
            }
        }
        return this.isDone;
    }

    /// <summary>
    /// 等待完成,阻塞进程
    /// </summary>
    public WaitForCompletion() {
        let startTick = Date.now();
        while (!this.isDone) {
            console.log("--------WaitForCompletion----- !!");
            if (this.downloadFail) {
                break;
            }

            if (this.IsDone()) {
                break;
            }

            let nowTick = Date.now();
            if (nowTick - startTick > 3000) {
                break;
            }
        }
    }

    /// <summary>
    /// 检测依赖资源是否加载完成
    /// </summary>
    /// <returns></returns>
    public CheckComplete(): boolean {
        for (let i = this.dependAB.length - 1; i >= 0; --i) {
            if (!this.loader?.CheckEasyAssetBundleCompleted(this.dependAB[i])) {
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// 重新使用
    /// </summary>
    public Reuse() {
        this.isInPool = false;
        MessageMgr.Instance().On(Const.DOWNLOAD_SUCCESS, this, this.OnABDownloadSuccess);
        MessageMgr.Instance().On(Const.DOWNLOAD_FAIL, this, this.OnABDownloadFailed);
    }

    /// <summary>
    /// 重置
    /// </summary>
    public Reset() {
        MessageMgr.Instance().Off(Const.DOWNLOAD_SUCCESS, this, this.OnABDownloadSuccess);
        MessageMgr.Instance().Off(Const.DOWNLOAD_FAIL, this, this.OnABDownloadFailed);
        this.dependAB = [];
        this.loader = undefined;
        this.isDone = false;
        this.downloadFail = false;
        this.isInPool = true;
    }

    /// <summary>
    /// 有ab包下载完回调
    /// </summary>
    /// <param name="eventArg"></param>
    public OnABDownloadSuccess() {
        if (!this.isDone) {
            if (this.IsDone()) {

            }
        }
    }

    /// <summary>
    /// 有ab包下载失败回调
    /// </summary>
    /// <param name="eventArg"></param>
    public OnABDownloadFailed(...args: any[]) {
        let md5 = args[0];
        let result = this.loader?.catalogs.GetEasyAssetBundleInfoByMD5(md5);
        if (result && this.dependAB.includes(result[1])) {
            this.downloadFail = true;
        }
    }
}