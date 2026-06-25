
/// <summary>
/// 多资源的句柄

import { Node, PackedScene, Resource, WeakRef } from "godot";
import BaseGodotAssetHandle from "./BaseGodotAssetHandle";
import BaseAssetHandle from "./BaseAssetHandle";

/// </summary>
export class MultiGodotAssetHandle extends BaseGodotAssetHandle {
    /// <summary>
    /// 加载的多资源路径
    /// </summary>
    /// <typeparam name="string"></typeparam>
    /// <returns></returns>
    public paths: string[] = [];

    /// <summary>
    /// 加载的多资源结果
    /// </summary>
    public result: (Resource | null)[] | undefined = undefined;

    /// <summary>
    /// 重置
    /// </summary>
    public override Reset() {
        super.Reset();
        this.paths = [];
        this.result = [];
    }

    /// <summary>
    /// 获取加载资源路径
    /// </summary>
    /// <returns></returns>
    public GetPaths(): string[] {
        return this.paths;
    }

    /// <summary>
    /// 获取加载结果
    /// </summary>
    /// <returns></returns>
    public GetResult(): (Resource | null)[] | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        if (this.result == undefined) {
            if (this.IsDone()) {
                this.result = [];
                for (let path of this.paths) {
                    var item = this.loader?.LoadGodotAssetAtPath<Resource>(path, Resource);
                    if (item)
                        this.result.push(item);
                    else
                        this.result.push(null);
                }
            }
        }
        return this.result;
    }

    /// <summary>
    /// 异步获取加载结果
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async GetResultAsync(action: (result: (Resource | null)[] | undefined) => {}): Promise<(Resource | null)[] | undefined> {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (this.IsDone()) {
            let result = this.GetResult();
            action(result);
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
                action(result);
                return result;
            }
            else {
                action(undefined);
                return undefined;
            }
        });
    }

    /// <summary>
    /// 实例对象
    /// </summary>
    /// <returns></returns>
    public Instantiates(): (Node | null)[] | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }
        if (!this.IsDone()) {
            this.WaitForCompletion();
        }
        let objects: (Node | null)[] | undefined = undefined;
        if (this.IsDone()) {
            objects = [];
            let temps = this.GetResult();
            if (temps) {
                for (let i = 0; i < temps.length; i++) {
                    var pack = this.GetResult();
                    if (pack instanceof PackedScene) {
                        let instance = pack.instantiate();
                        this.weakReferences.push(new WeakRef(instance));
                        objects.push(instance);
                    }
                    else {
                        objects.push(null);
                    }
                }
            }
        }
        return objects;
    }

    /// <summary>
    /// 异步实例对象
    /// </summary>
    /// <param name="action"></param>
    /// <returns></returns>
    public async InstantiatesAsync(action?: (result: (Node | null)[] | undefined) => {}): Promise<(Node | null)[] | undefined> {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }

        if (this.IsDone()) {
            let result = this.Instantiates();
            action?.caller(result);
            return result;
        }

        let delay = new Promise(resolve => setTimeout(resolve, BaseGodotAssetHandle.instanceOverTime));
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
                let result = this.Instantiates();
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
    /// 实例化对象
    /// </summary>
    /// <param name="path"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public Instantiate(path: string): Node | undefined {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }

        if (!this.IsDone()) {
            this.WaitForCompletion();
        }

        let index = this.paths.indexOf(path);
        let results = this.GetResult();
        let pack = results == undefined ? undefined : results[index];
        if (pack instanceof PackedScene) {
            let instance = pack.instantiate();
            this.weakReferences.push(new WeakRef(instance));
            return instance;
        }
        else {
            return undefined;
        }
    }

    /// <summary>
    /// 异步实例化对象
    /// </summary>
    /// <param name="path"></param>
    /// <param name="action"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async InstantiateAsync(path: string, action?: (result: Node | undefined) => {}): Promise<Node | undefined> {
        if (this.isInPool) {
            throw new Error("handle 已被回收 !!");
        }

        if (!this.IsDone()) {
            let result = this.Instantiate(path);
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
                let result = this.Instantiate(path);
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
    /// 释放多个对象
    /// </summary>
    /// <param name="t"></param>
    public ReleaseInstances(t: Node[]) {
        for (var item of t) {
            this.ReleaseInstance(item);
        }
    }
}