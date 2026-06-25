import { BindMsg } from "../Message/BindMsg";
import { MessageMgr } from "../Message/MessageMgr";
import Catalogs from "./Catalogs";
import { Const, DownloadPriority, DownloadType } from "./Const";
import { DownloadCode, Downloader } from "./Downloader/Downloader";
import HttpDownloader from "./Downloader/HttpDownloader";
import EasyAssetsLoader from "./EasyAssetsLoader";
import { EasyAssetConfig } from "./EasyAssetConfig";
import { DirAccess, FileAccess, HTTPClient, HTTPRequest, OS, PackedByteArray, PackedStringArray } from "godot";


/// <summary>
/// 下载完成失败事件参数
/// </summary>
export class DownloadEventArg {
    public md5: string = "";
}

/// <summary>
/// 下载ab包总控制器
/// </summary>
export class DownloadCtrl {
    /// <summary>
    /// 需要更新AssetsBundle
    /// </summary>
    private _allDownloader: Downloader[] = [];

    /// <summary>
    /// 目标所有AB包被的资源信息表
    /// </summary>
    private _targetCatalogs: Catalogs | undefined = undefined;

    /// <summary>
    /// 本地所有AB包被的资源信息表
    /// </summary>
    private _localCatalogs: Catalogs | undefined = undefined;
    /// <summary>
    /// 下载失败
    /// </summary>
    private _downloadFail: boolean = false;

    /// <summary>
    /// 强更
    /// </summary>
    private _foreStoreUpdate: boolean = false;

    /// <summary>
    /// 强热更
    /// </summary>
    private _forceHotUpdate: boolean = false;

    /// <summary>
    /// 是否开启热更新
    /// </summary>
    private _hotUpdate: boolean = false;

    /// <summary>
    /// 最大下载数量
    /// </summary>
    private _maxDownloadNum: number = 5;

    /// <summary>
    /// 资源加载器
    /// </summary>
    private _assetsLoader: EasyAssetsLoader | undefined;

    /// <summary>
    /// 初始化成功回调
    /// </summary>
    private _initComplete: Function | undefined;

    /// <summary>
    /// 重置
    /// </summary>
    public Reset() {
        MessageMgr.Instance().OffByTarget(this);
    }

    /// <summary>
    /// 检测更新
    /// </summary>
    /// <param name="complete"></param>
    public async CheckUpdate(assetsLoader: EasyAssetsLoader) : Promise<boolean> {
        this._assetsLoader = assetsLoader;
        let abEasyConfig = this._assetsLoader.EasyAssetConfig;
        this._hotUpdate = abEasyConfig.hotUpdate;
        this._forceHotUpdate = abEasyConfig.forceHotUpdate;
        this._maxDownloadNum = abEasyConfig.maxDownloadNum;
        if (!this._hotUpdate) {
            return true;
        }

        let result = false;
        let call = false;
        this._initComplete = (v : boolean)=>{
            result = v;
            call = true;
        };
        console.log("CheckUpdate 11111111111111111111");
        this._localCatalogs = Catalogs.FromJson(FileAccess.open(Const.localVersionPath, FileAccess.ModeFlags.READ)?.get_as_text() ?? "{}");
        this.CheckVersion(abEasyConfig.requestVersionUrl);
        await new Promise((resolve)=>{ 
            let interval = setInterval(()=>{
                if(call) {
                    resolve("");
                    clearInterval(interval);
                }
            });
         });
        return result;
    }

    private CheckVersion(requestVersionUrl: string){
        var request = new HTTPRequest();
        request.use_threads = true;
        request.request(requestVersionUrl, [], HTTPClient.Method.METHOD_GET);
        request.request_completed.emit = (v1: number, v2: number, v3: PackedStringArray, v4: PackedByteArray) => {
            let targetJsonStr = request.download_file;
            if (targetJsonStr == "") {
                this.CheckVersion(requestVersionUrl);
                return;
            }

            let abVersion = JSON.parse(targetJsonStr);
            if (this._localCatalogs && this._localCatalogs.version >= abVersion.version) {
                this.CheckUpdateBundles();
                return;
            }

            if (this._localCatalogs && this._localCatalogs.versionCode < abVersion.versionCode) {
                this._foreStoreUpdate = true;
                return;
            }

            this.CheckCatalogs(abVersion.requestCatalogsUrl);
            return;
        };

    }

    private CheckCatalogs(requestCatalogsUrl: string) {
        var request = new HTTPRequest();
        request.use_threads = true;
        request.request(requestCatalogsUrl, [], HTTPClient.Method.METHOD_GET);
        request.request_completed.emit = (v1: number, v2: number, v3: PackedStringArray, v4: PackedByteArray) => {
            //没有拉取到数据，加载失败
            //string inLineJsonStr = FileMgr.Instance.DecryptFileData(request.downloadHandler.text);
            let targetJsonStr = request.download_file;
            if (targetJsonStr == "") {
                this.CheckCatalogs(requestCatalogsUrl);
                return;
            }

            // targetJsonStr = XOREncryption.DecryptData(targetJsonStr, XOREncryption.DEFAULT_ENCRYPT_KEY);
            try {
                // this._targetCatalogs = JsonConvert.DeserializeObject<Catalogs>(targetJsonStr);
                this._targetCatalogs = Catalogs.FromJson(targetJsonStr);
                if (this._forceHotUpdate) {
                    this._localCatalogs = undefined;
                }
                this.CheckUpdateBundles();
            }
            catch (Exception) {
                this.CheckCatalogs(requestCatalogsUrl);
            }
        };
    }


    /// <summary>
    /// 检测要更新的bundle
    /// </summary>
    private CheckUpdateBundles() {
        if (this._targetCatalogs != null) {
            this.CheckCatalogsDownload(this._targetCatalogs);
        }
        if (this._localCatalogs != null) {
            this.CheckCatalogsDownload(this._localCatalogs);
        }
        this.DownloadStart();
    }

    /// <summary>
    /// 通过资源详情表判断要下载的bundle
    /// </summary>
    /// <param name="catalogs"></param>
    private CheckCatalogsDownload(catalogs: Catalogs) {
        for (let abInfo of catalogs.allEasyAssetBundleInfos) {
            {
                const pckPath = Const.localAssetBundleFolder + abInfo.md5 + ".pck";
                const legacyPath = Const.localAssetBundleFolder + abInfo.md5;
                const filePath = FileAccess.file_exists(pckPath) ? pckPath : legacyPath;
                if (FileAccess.file_exists(filePath) && FileAccess.get_size(filePath) == abInfo.size) {
                    let md5 = FileAccess.get_md5(filePath);
                    if (abInfo.md5 == md5) {
                        continue;
                    }
                }

                let have = false;
                for (let abDownloader of this._allDownloader) {
                    if (abDownloader.fileName == abInfo.md5) {
                        if (abDownloader.version > catalogs.version) {
                            abDownloader.version = catalogs.version;
                        }
                        have = true;
                        break;
                    }
                }
                if (!have) {
                    let abDownloader = new HttpDownloader(abInfo.md5, abInfo.size, abInfo.abDownloadPriority, catalogs.version, Const.localAssetBundleFolder, this.UpdateBundleCallBack, catalogs.updateUrls);
                    this._allDownloader.push(abDownloader);
                }
            }
        }
    }

    /// <summary>
    /// 更新完bundle的回调
    /// </summary>
    /// <param name="code"></param>
    /// <param name="fileName"></param>
    private UpdateBundleCallBack(code: DownloadCode, fileName: string) {
        let arg: DownloadEventArg = new DownloadEventArg();
        arg.md5 = fileName;
        if (code == DownloadCode.Success) {
            MessageMgr.Instance().Emit(Const.DOWNLOAD_SUCCESS, arg);
        }
        else {
            MessageMgr.Instance().Emit(Const.DOWNLOAD_FAIL, arg);
        }
    }

    /// <summary>
    /// 下载开始,监听其他下载是否完成后,再开始下载
    /// </summary>
    /// <param name="eventArg"></param>
    @BindMsg(Const.DOWNLOAD_SUCCESS, Const.DOWNLOAD_FAIL)
    private OnDownloadStart(eventArg: DownloadEventArg) {
        this.DownloadStart();
    }

    /// <summary>
    /// 下载开始
    /// </summary>
    private DownloadStart() {
        let needSize: number = this.GetNeedSize();
        // let remainSize = Tools.GetFreeDiskSpace();
        let remainSize = 500;
        if (remainSize < needSize) {
            this.DownloadFail();
            return;
        }

        let nowInDownload = 0;
        for (let abDownloader of this._allDownloader) {
            if (abDownloader.downloadType == DownloadType.Start || abDownloader.downloadType == DownloadType.InProgress) {
                ++nowInDownload;
            }
        }

        let remain = this._maxDownloadNum - nowInDownload;
        if (remain > 0) {
            for (let abDownloader of this._allDownloader) {
                if (abDownloader.downloadType == DownloadType.NoStart || abDownloader.downloadType == DownloadType.Fail) {
                    --remain;
                    abDownloader.Start();
                }
                if (remain == 0) {
                    break;
                }
            }
        }

        if (this._localCatalogs != null && this.MustDownloadCompleted(this._localCatalogs.version)) {
            this.LocalMustDownloadSuccess();
        }

        if (this._targetCatalogs != null && this.MustDownloadCompleted(this._targetCatalogs.version)) {
            this.TargetMustDownloadSuccess();
        }

        if (this._targetCatalogs == null && this._localCatalogs != null && this.DownloadCompleted(this._localCatalogs.version)) {
            this.DeleteInvalidFile();
        }

    }

    public InitCallback(value: boolean) {
        if (this._initComplete != null) {
            var tmp = this._initComplete;
            this._initComplete = undefined;
            tmp(value);
        }
    }

    /// <summary>
    /// 本地资源列表里,必须下载完的部分下载完成
    /// </summary>
    public LocalMustDownloadSuccess() {
        if (!this._forceHotUpdate || this._targetCatalogs == null) {
            this.InitCallback(true);
        }
    }

    /// <summary>
    /// 目标资源列表里,必须下载完的部分下载完成
    /// </summary>
    public TargetMustDownloadSuccess() {
        if (this._forceHotUpdate) {
            this.ChangeCatalogs();
            this.InitCallback(true);
        }
    }

    /// <summary>
    /// 下载失败
    /// </summary>
    public DownloadFail() {
        let _downloadFail = true;
        for (let abDownloader of this._allDownloader) {
            abDownloader.Dispose(true);
        }
        this.InitCallback(false);
    }

    /// <summary>
    /// 删除无效文件
    /// </summary>
    public DeleteInvalidFile() {
        if (this._localCatalogs != undefined) {
            let files = DirAccess.get_files_at(Const.localAssetBundleFolder);
            let fileNames = [];
            for (let i = 0; i < files.size(); i++) {
                let filePath = files.get(i);
                fileNames[i] = filePath;
            }
            for (let abInfo of this._localCatalogs.allEasyAssetBundleInfos) {
                if (!files.has(abInfo.md5)) {
                    DirAccess.remove_absolute(abInfo.md5);
                }
            }
        }
    }

    /// <summary>
    /// 目标资源列表文件覆盖本地资源列表文件
    /// </summary>
    private ChangeCatalogs() {
        if (this._targetCatalogs != null) {
            var file = FileAccess.open("Const.localVersionPath,", FileAccess.ModeFlags.WRITE)
            file?.store_string(JSON.stringify(this._targetCatalogs));
        }
    }

    /// <summary>
    /// 是否需要强更
    /// </summary>
    /// <returns></returns>
    public NeedForeUpdate() {
        return this._foreStoreUpdate;
    }

    /// <summary>
    /// 是否下载失败
    /// </summary>
    /// <returns></returns>
    public IsDownLoadFail() {
        return this._downloadFail;
    }

    /// <summary>
    /// 开始下载ab包
    /// </summary>
    /// <param name="md5"></param>
    public StartDownload(md5: string) {
        if (this._allDownloader.length == 0) {
            return;
        }

        for (let downloader of this._allDownloader) {
            if (downloader.fileName == md5 && (downloader.downloadType == DownloadType.NoStart || downloader.downloadType == DownloadType.Fail)) {
                if (downloader.downloadPriority == DownloadPriority.Low) {
                    downloader.downloadPriority = DownloadPriority.High;
                }
                downloader.downloadWeight += 1;
            }
        }

        this.DownloadStart();
    }

    /// <summary>
    /// 下载完成
    /// </summary>
    /// <param name="version"></param>
    /// <returns></returns>
    public DownloadCompleted(version: number) {
        return !this._allDownloader.some(downloader => downloader.version == version && downloader.downloadType != DownloadType.Complete);
    }

    /// <summary>
    /// 必须下载的资源下载完成
    /// </summary>
    /// <param name="version"></param>
    /// <returns></returns>
    public MustDownloadCompleted(version: number) {
        return !this._allDownloader.some(downloader => downloader.version == version && downloader.downloadPriority == DownloadPriority.Must && downloader.downloadType != DownloadType.Complete);
    }

    /// <summary>
    /// 下载进度
    /// </summary>
    /// <returns></returns>
    public Progress(): number {
        let size = this.GetSizeInfo();
        return size.downloadedSize * 1.0 / size.totalSize;
    }

    /// <summary>
    /// 还需要的空间大小
    /// </summary>
    /// <returns></returns>
    public GetNeedSize(): number {
        let size = this.GetSizeInfo();
        return size.totalSize - size.downloadedSize;
    }

    /// <summary>
    /// 已下载的空间大小和总共需要的工具大小
    /// </summary>
    /// <param name="downloadedSize"></param>
    /// <param name="totalSize"></param>
    public GetSizeInfo(): { downloadedSize: number, totalSize: number } {
        let downloadedSize = 0;
        let totalSize = 0;
        for (let downloader of this._allDownloader) {
            downloadedSize += downloader.downloadType == DownloadType.Complete ? downloader.size : downloader.currentSize;
            totalSize += downloader.size;
        }
        return { downloadedSize: downloadedSize, totalSize: totalSize }
    }
}
