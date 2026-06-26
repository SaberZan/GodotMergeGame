/// <summary>
/// 单资源的句柄
/// </summary>

import BaseAssetHandle from "./BaseAssetHandle";
import { LoggerMgr } from "../../Logger/LoggerMgr";
import { PackedByteArray } from "godot";

export default class MultiRawAssetHandle extends BaseAssetHandle {
    /// <summary>
    /// 资源路径
    /// </summary>
    public paths: string[] = [];

    /// <summary>
    /// 加载结果
    /// </summary>
    public result: (PackedByteArray | null)[] | undefined = undefined;

    /// <summary>
    /// 重置
    /// </summary>
    public override Reset() {
        super.Reset();
        this.paths = [];
        this.result = [];
    }

    /// <summary>
    /// 获取路径
    /// </summary>
    /// <returns></returns>
    public GetPaths(): string[] {
        return this.paths;
    }

    /// <summary>
    /// 同步获取结果
    /// </summary>
    /// <returns></returns>
    public GetResult(): (PackedByteArray | null)[] | undefined {
        if (this.isInPool) {
            LoggerMgr.Instance().LogError("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        if (this.result == undefined) {
            this.result = [];
            for (let path in this.paths) {
                var item = this.loader?.LoadRawAssetAtPath(path) ?? null;
                this.result.push(item);
            }
        }
        return this.result;
    }

    /// <summary>
    /// 异步获取结果
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async GetResultAsync(action?: (result: (PackedByteArray | null)[] | undefined) => {}): Promise<(PackedByteArray | null)[] | undefined> {
        if (this.isInPool) {
            LoggerMgr.Instance().LogError("handle 已被回收 !!");
        }

        if (this.IsDone()) {
            let result = this.GetResult();
            action?.caller(result);
            return result;
        }

        let delay = new Promise(resolve => setTimeout(resolve, BaseAssetHandle.instanceOverTime));
        let loadOver = new Promise(resolve => {
            let timer = setInterval(() => {
                if (this.IsDone()) {
                    clearInterval(timer);
                    resolve(true);
                }
            });
            if (this.IsDone()) {
                clearInterval(timer);
                resolve(true);
            }
        });
        return Promise.race([loadOver, delay]).then(() => {
            if (this.isDone) {
                let result = this.GetResult();
                action?.caller(result);
                return result;
            }
            else {
                action?.caller(undefined);
                return undefined;
            }
        });
    }

}
