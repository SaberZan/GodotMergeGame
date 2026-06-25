
/// <summary>
/// 单资源的句柄
/// </summary>

import { byte, PackedByteArray } from "godot";
import BaseAssetHandle from "./BaseAssetHandle";

/// <typeparam name="T"></typeparam>
export class SingleRawAssetHandle extends BaseAssetHandle {
    /// <summary>
    /// 资源路径
    /// </summary>
    public path: string = "";

    /// <summary>
    /// 加载结果
    /// </summary>
    public result: PackedByteArray | null | undefined = undefined;

    /// <summary>
    /// 重置
    /// </summary>
    public override Reset() {
        super.Reset();
        this.path = "";
        this.result = undefined;
    }

    /// <summary>
    /// 获取路径
    /// </summary>
    /// <returns></returns>
    public GetPath(): string {
        return this.path;
    }

    /// <summary>
    /// 同步获取结果
    /// </summary>
    /// <returns></returns>
    public GetResult(): PackedByteArray | null | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        if (this.result == undefined) {
            this.result = this.loader?.LoadRawAssetAtPath(this.path);
        }
        return this.result;
    }

    /// <summary>
    /// 异步获取结果
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async GetResultAsync(action?: (result: PackedByteArray | null | undefined) => {}): Promise<PackedByteArray | null | undefined> {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
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