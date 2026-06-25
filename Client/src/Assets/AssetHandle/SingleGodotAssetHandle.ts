/// <summary>
/// 单资源的句柄
/// </summary>

import { Node, Node2D, PackedScene, Resource, WeakRef } from "godot";
import BaseGodotAssetHandle from "./BaseGodotAssetHandle";
import BaseAssetHandle from "./BaseAssetHandle";

/// <typeparam name="T"></typeparam>
export class SingleGodotAssetHandle<T extends Resource> extends BaseGodotAssetHandle {
    /// <summary>
    /// 资源路径
    /// </summary>
    public path: string = "";

    /// <summary>
    /// 加载结果
    /// </summary>
    public result: T | undefined;

    /// <summary>
    /// 资源构造类
    /// </summary>
    public type: { new(identifier?: any): T };

    constructor(type: { new(identifier?: any): T }) {
        super();
        this.type = type;
    }

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
    public GetResult(): T | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        if (this.result == undefined) {
            this.result = this.loader?.LoadGodotAssetAtPath<T>(this.path, this.type);
        }
        return this.result;
    }

    /// <summary>
    /// 异步获取结果
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async GetResultAsync(action?: (result: T | undefined) => {}): Promise<T | undefined> {
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

    /// <summary>
    /// 同步实例对象
    /// </summary>
    /// <returns></returns>
    public Instantiate(): Node | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        var pack = this.GetResult();
        if (pack instanceof PackedScene) {
            let instance = pack.instantiate();
            this.weakReferences.push(new WeakRef(instance));
            return <Node>instance;
        }
        return undefined;
    }

    /// <summary>
    /// 异步实例对象
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async InstantiateAsync(action?: (node: Node | undefined) => {}): Promise<Node | undefined> {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (this.IsDone()) {
            let instance = this.Instantiate();
            action?.caller(instance);
            return instance;
        }

        let delay = new Promise(resolve => setTimeout(()=>{ resolve(""); }, BaseAssetHandle.instanceOverTime));
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
                let instance = this.Instantiate();
                action?.caller(instance);
                return instance;
            }
            else {
                action?.caller(undefined);
                return undefined;
            }
        });
    }

    /// <summary>
    /// 释放对象
    /// </summary>
    /// <param name="t"></param>
    public override ReleaseInstance(t: Node | undefined) {
        super.ReleaseInstance(t);
    }
}
