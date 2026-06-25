
/// <summary>
/// 句柄基类

import { Node, WeakRef } from "godot";
import BaseAssetHandle from "./BaseAssetHandle";
import { LoggerMgr } from "../../Logger/LoggerMgr";

/// </summary>
export default class BaseGodotAssetHandle extends BaseAssetHandle {
    /// <summary>
    /// 是否自动释放
    /// </summary>
    private isAutoRelease: boolean = false;

    public weakReferences: WeakRef[] = [];
    /// <summary>
    /// 重置
    /// </summary>
    public override Reset(): void {
        this.weakReferences = [];
        super.Reset();
    }

    /// <summary>
    /// 释放实例
    /// </summary>
    /// <param name="t"></param>
    public ReleaseInstance(t: Node | undefined) {
        if (!t)
            return;
        let hasReference = false;
        for (let i = this.weakReferences.length - 1; i >= 0; --i) {
            if (this.weakReferences[i].get_ref() == t) {
                hasReference = true;
                delete this.weakReferences[i];
            }
        }
        if (!hasReference) {
            LoggerMgr.Instance().LogError("obj is not instance from this handle");
        }
        t.queue_free();
    }

    /// <summary>
    /// 实例的个数
    /// </summary>
    /// <returns></returns>
    public AliveCount(): number {
        let count = 0;
        for (let i = this.weakReferences.length - 1; i >= 0; --i) {
            if (this.weakReferences[i].get_ref()) {
                ++count;
                this.weakReferences.splice(i);
            }
        }
        return count;
    }

    /// <summary>
    /// 是否自动释放
    /// </summary>
    /// <returns></returns>
    public IsAutoRelease(): boolean {
        return this.isAutoRelease;
    }

    /// <summary>
    /// 设置自动释放
    /// </summary>
    /// <param name="value"></param>
    public SetAutoRelease(value: boolean) {
        this.isAutoRelease = value;
    }

}