

/// <summary>
/// 接口：池对象

import { Singleton } from "../Utils/Singleton";

/// </summary>
export interface IPoolObject {
    Reset(): void;
}

/// <summary>
/// 对象池类
/// 需要对象池的地方，构建一个对象池
/// 加入工厂方法、回收方法、对象个数
/// </summary>
export class ObjectPool {
    public _max: number = -1;

    /// <summary>
    /// 缓存栈（所有对象保存的容器）
    /// </summary>
    private _cacheStack: any[] = [];

    /// <summary>
    /// 获取对象
    /// </summary>
    /// <returns>对象</returns>
    public Get<T>(ctor: new () => T): T {
        if (this._cacheStack.length == 0) {
            return new ctor();
        }
        else {
            return <T><unknown>this._cacheStack.pop();
        }
    }

    /// <summary>
    /// 回收
    /// </summary>
    /// <param name="obj">类型对象</param>
    /// <returns></returns>
    public Put(obj: any) {
        if (this._max == -1 || this._cacheStack.length < this._max) {
            if (obj && typeof (obj as IPoolObject).Reset === 'function') {
                (obj as IPoolObject).Reset();
            }
            this._cacheStack.push(obj);
        }
        else {
            obj = null;
        }
    }

    /// <summary>
    /// 设置缓存最大值
    /// </summary>
    /// <param name="maxNum"></param>
    public SetMaxNum(maxNum: number) {
        this._max = maxNum;
    }
}

/// <summary>
/// 缓存值对象
/// </summary>
export class ObjectPoolMgr extends Singleton<ObjectPoolMgr> {
    private readonly _pools: { [key: string]: ObjectPool } = {};

    public async Init(): Promise<boolean> {
        return true;
    }

    /// <summary>
    /// 回收对象
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public GetObject<T>(ctor: new () => T): T {

        let name = ctor.name;
        if (!this._pools[name]) {
            this._pools[name] = new ObjectPool();
        }
        return this._pools[name].Get<T>(ctor);

    }

    /// <summary>
    /// 回收对象
    /// </summary>
    /// <param name="obj"></param>
    public PutObject(ctor: new () => any, obj: any) {

        let name = ctor.name;
        if (!this._pools[name]) {
            this._pools[name] = new ObjectPool();
        }
        if (obj && typeof (obj as IPoolObject).Reset === 'function') {
            (obj as IPoolObject).Reset();
        }
        this._pools[name].Put(obj);

    }

    /// <summary>
    /// 设置对象池最大值
    /// </summary>
    /// <param name="maxNum"></param>
    /// <typeparam name="T"></typeparam>
    public SetPoolMaxNum(ctor: new () => any, maxNum: number) {
        let name = ctor.name;
        if (this._pools[name]) {
            this._pools[name].SetMaxNum(maxNum);
        }
    }
}