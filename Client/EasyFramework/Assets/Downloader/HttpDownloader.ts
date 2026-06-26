import { Callable, DirAccess, Engine, FileAccess, HTTPClient, HTTPRequest, PackedByteArray, PackedStringArray } from "godot";
import { DownloadPriority, DownloadType } from "../Const";
import { DownloadCode, Downloader } from "./Downloader";

export default class HttpDownloader extends Downloader {
    private _downloadUrls: string[] = [];
    private _request: HTTPRequest | undefined;
    private _urlIndex: number = 0;
    private _disposed: boolean = false;
    private _resumeSize: number = 0;

    public constructor(fileName: string, size: number, downloadPriority: DownloadPriority, version: number, saveDirPath: string, callback: (code: DownloadCode, md5: string) => void, downloadUrls: string[]) {
        super(fileName, size, downloadPriority, version, saveDirPath, callback as (code: DownloadCode, md5: string) => {});
        this._downloadUrls = downloadUrls;
    }

    public Start(timeout: number = 10): void {
        super.Start(timeout);
        this._disposed = false;
        this._urlIndex = 0;
        this.currentSize = this.GetFileSize(this.TempFilePath);
        this.downloadType = DownloadType.InProgress;

        if (this._downloadUrls.length == 0) {
            this.Finish(DownloadCode.DownloadFail);
            return;
        }

        if (this.saveDirPath != "" && !DirAccess.dir_exists_absolute(this.saveDirPath)) {
            DirAccess.make_dir_recursive_absolute(this.saveDirPath);
        }

        this.StartRequest(timeout);
    }

    public Dispose(force: boolean = false): void {
        this._disposed = true;
        this.DisposeRequest();
        if (force && this.downloadType != DownloadType.Complete) {
            this.downloadType = DownloadType.Fail;
        }
    }

    private StartRequest(timeout: number): void {
        this.DisposeRequest();

        if (this._urlIndex >= this._downloadUrls.length) {
            this.Finish(DownloadCode.DownloadFail);
            return;
        }

        let mainLoop = Engine.get_main_loop() as any;
        let root = mainLoop != null && typeof mainLoop.get_root == "function" ? mainLoop.get_root() : undefined;
        if (root == undefined) {
            this.Finish(DownloadCode.DownloadFail);
            return;
        }

        let request = new HTTPRequest();
        request.use_threads = true;
        request.timeout = timeout;
        this._resumeSize = this.GetFileSize(this.TempFilePath);
        request.download_file = this._resumeSize > 0 ? this.PartFilePath : this.TempFilePath;
        request.request_completed.connect(Callable.create((result: number, responseCode: number, headers: PackedStringArray, body: PackedByteArray) => {
            this.OnRequestCompleted(result, responseCode, headers, body, timeout);
        }));

        root.add_child(request);
        this._request = request;

        let headers = this._resumeSize > 0 ? ["Range: bytes=" + this._resumeSize + "-"] : [];
        let error = request.request(this.BuildUrl(this._downloadUrls[this._urlIndex]), headers, HTTPClient.Method.METHOD_GET);
        if (error != 0) {
            this.TryNextUrl(timeout);
        }
    }

    private OnRequestCompleted(result: number, responseCode: number, _headers: PackedStringArray, _body: PackedByteArray, timeout: number): void {
        if (this._disposed) {
            return;
        }

        if (this._request != undefined) {
            this.currentSize = this._resumeSize + this._request.get_downloaded_bytes();
        }

        this.DisposeRequest();

        if (result != HTTPRequest.Result.RESULT_SUCCESS || responseCode < 200 || responseCode >= 300) {
            if (responseCode == 416 && this.TryFinishTempFile()) {
                return;
            }
            this.TryNextUrl(timeout);
            return;
        }

        if (!this.MergeResponseFile(responseCode)) {
            this.TryNextUrl(timeout, DownloadCode.TempFileMissing);
            return;
        }

        let fileSize = this.GetFileSize(this.TempFilePath);
        if (fileSize <= 0) {
            this.TryNextUrl(timeout, DownloadCode.DownloadContentEmpty);
            return;
        }

        if (this.size > 0 && fileSize != this.size) {
            this.TryNextUrl(timeout);
            return;
        }

        let md5 = FileAccess.get_md5(this.TempFilePath);
        if (this.fileName != "" && md5 != this.fileName) {
            this.DeleteFile(this.TempFilePath);
            this.DeleteFile(this.PartFilePath);
            this.TryNextUrl(timeout);
            return;
        }

        this.DeleteFile(this.ABFilePath);
        if (DirAccess.rename_absolute(this.TempFilePath, this.ABFilePath) != 0) {
            this.TryNextUrl(timeout, DownloadCode.FinalFail);
            return;
        }

        this.currentSize = fileSize;
        this.Finish(DownloadCode.Success, md5);
    }

    private TryNextUrl(timeout: number, finalCode: DownloadCode = DownloadCode.DownloadFail): void {
        this.DeleteFile(this.PartFilePath);
        this.currentSize = this.GetFileSize(this.TempFilePath);
        ++this._urlIndex;
        if (this._urlIndex >= this._downloadUrls.length) {
            this.Finish(finalCode);
            return;
        }
        this.StartRequest(timeout);
    }

    private Finish(code: DownloadCode, md5: string = this.fileName): void {
        this.DisposeRequest();
        this.downloadType = code == DownloadCode.Success ? DownloadType.Complete : DownloadType.Fail;
        if (this._callback != undefined) {
            this._callback(code, md5);
        }
    }

    private DisposeRequest(): void {
        if (this._request == undefined) {
            return;
        }
        this._request.cancel_request();
        this._request.queue_free();
        this._request = undefined;
    }

    private BuildUrl(baseUrl: string): string {
        if (baseUrl.endsWith(this.fileName)) {
            return baseUrl;
        }
        return baseUrl.endsWith("/") ? baseUrl + this.fileName : baseUrl + "/" + this.fileName;
    }

    private MergeResponseFile(responseCode: number): boolean {
        if (this._resumeSize <= 0) {
            return FileAccess.file_exists(this.TempFilePath);
        }

        if (!FileAccess.file_exists(this.PartFilePath)) {
            return false;
        }

        if (responseCode == 206) {
            let partFileSize = FileAccess.get_size(this.PartFilePath);
            if (partFileSize <= 0) {
                return false;
            }

            let partBytes = FileAccess.get_file_as_bytes(this.PartFilePath);
            let tempFile = FileAccess.open(this.TempFilePath, FileAccess.ModeFlags.READ_WRITE);
            if (tempFile == null) {
                return false;
            }
            tempFile.seek_end();
            tempFile.store_buffer(partBytes);
            tempFile.close();
            this.DeleteFile(this.PartFilePath);
            return true;
        }

        if (responseCode == 200) {
            this.DeleteFile(this.TempFilePath);
            return DirAccess.rename_absolute(this.PartFilePath, this.TempFilePath) == 0;
        }

        return false;
    }

    private TryFinishTempFile(): boolean {
        let fileSize = this.GetFileSize(this.TempFilePath);
        if (this.size > 0 && fileSize != this.size) {
            return false;
        }

        let md5 = FileAccess.get_md5(this.TempFilePath);
        if (this.fileName != "" && md5 != this.fileName) {
            return false;
        }

        this.DeleteFile(this.ABFilePath);
        if (DirAccess.rename_absolute(this.TempFilePath, this.ABFilePath) != 0) {
            this.Finish(DownloadCode.FinalFail);
            return true;
        }

        this.currentSize = fileSize;
        this.Finish(DownloadCode.Success, md5);
        return true;
    }

    private GetFileSize(path: string): number {
        return FileAccess.file_exists(path) ? FileAccess.get_size(path) : 0;
    }

    private DeleteFile(path: string): void {
        if (FileAccess.file_exists(path)) {
            DirAccess.remove_absolute(path);
        }
    }

    private get TempFilePath(): string { return this.ABFilePath + ".download"; }

    private get PartFilePath(): string { return this.ABFilePath + ".part"; }
}
