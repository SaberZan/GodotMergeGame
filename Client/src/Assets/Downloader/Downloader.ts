import { DownloadPriority, DownloadType } from "../Const";

export enum DownloadCode {
    None,
    Success,
    DownloadFail,           //下载失败
    DownloadContentEmpty,    // 需要下载的文件内容为空
    TempFileMissing,            // 临时文件丢失
    FinalFail,            // 最终失败
}

export abstract class Downloader {
    /// <summary>
    /// AB包名 md5码
    /// </summary>
    public fileName: string = "";
    /// <summary>
    /// AB包大小
    /// </summary>
    public size: number = 0;
    /// <summary>
    /// 属于哪个版本
    /// </summary>
    public version: number = 0;
    /// <summary>
    /// 下载标志
    /// </summary>
    public downloadType: DownloadType = DownloadType.NoStart;
    /// <summary>
    /// 临时保存的文件夹
    /// </summary>
    public saveDirPath: string = "";
    /// <summary>
    /// 是否必须下载
    /// </summary>
    public downloadPriority: DownloadPriority = DownloadPriority.Must;
    /// <summary>
    /// 下载权重值
    /// </summary>
    public downloadWeight: number = 0;
    /// <summary>
    /// 当前AB包下载的大小
    /// </summary>
    public currentSize: number = 0;
    /// <summary>
    /// 保存位置
    /// </summary>
    public get ABFilePath(): string { return this.saveDirPath + this.fileName };
    /// <summary>
    /// 完成回调
    /// </summary>
    public _callback: ((code: number, md5: string) => void) | undefined = undefined;
    /// <summary>
    /// 下载失败计数
    /// </summary>
    private _downloadErrorCount: number = 0;

    public constructor(fileName: string, size: number, downloadPriority: DownloadPriority, version: number, saveDirPath: string, callback: (code: DownloadCode, md5: string) => {}) {
        this.fileName = fileName;
        this.size = size;
        this.version = version;
        this.downloadPriority = downloadPriority;
        this.saveDirPath = saveDirPath;
        this.downloadType = DownloadType.NoStart;
        this._callback = callback;
    }

    /// 
    /// 开始下载
    /// 
    /// 超时时间（秒）
    public Start(timeout: number = 10): void {
        this.downloadType = DownloadType.Start;
    }

    /// 
    /// 停止下载
    /// 
    /// 超时时间（秒）
    public Dispose(force: boolean = false): void {

    }


    /// <summary>
    /// 优先级比较
    /// </summary>
    /// <param name="other"></param>
    /// <returns></returns>
    public CompareTo(other: Downloader): number {
        if (this.version == other.version) {
            if (this.downloadPriority == other.downloadPriority) {
                return other.downloadWeight - this.downloadWeight;
            }
            return this.downloadPriority - other.downloadPriority;
        }
        else {
            return this.version < other.version ? -1 : 1;
        }
    }
}

