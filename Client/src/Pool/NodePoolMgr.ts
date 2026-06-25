import { Node, Resource } from "godot";
import { Singleton } from "../Utils/Singleton";
import { AssetsMgr } from "../Assets/AssetsMgr";
import { SingleGodotAssetHandle } from "../Assets/AssetHandle/SingleGodotAssetHandle";

class PoolObj {
    maxNum: number = 10;
    pool: Node[] = [];
    handle: SingleGodotAssetHandle<Resource> | undefined = undefined;
}

export class NodePoolMgr extends Singleton<NodePoolMgr> {

    pools: { [key: string]: PoolObj } = {};

    public GetObj(key: string) {
        if (!this.pools[key]) {
            this.pools[key] = new PoolObj();
        }

        let obj = null;
        if (this.pools[key].pool.length > 0) {
            obj = this.pools[key].pool.pop();
        } else {
            obj = this.pools[key].handle?.Instantiate();
        }
        return obj;
    }

    public async GetObjAsync(key: string): Promise<Node | undefined> {
        if (!this.pools[key]) {
            this.pools[key] = new PoolObj();
        }

        let obj = null;
        if (this.pools[key].pool.length > 0) {
            obj = this.pools[key].pool.pop();
        } else {
            obj = await this.pools[key].handle?.InstantiateAsync();
        }
        return obj;
    }

    public PutObj(key: string, obj: Node) {
        if (!this.pools[key]) {
            this.pools[key] = new PoolObj();
            this.pools[key].handle = AssetsMgr.Instance().LoadAsset<Resource>(key, Resource);
        }

        if (this.pools[key].pool.length > this.pools[key].maxNum) {
            obj.queue_free();
        } else {
            this.pools[key].pool.push(obj);
        }
    }


    public CleanByKey(key: string) {
        if (this.pools[key]) {
            for (let i = this.pools[key].pool.length - 1; i >= 0; --i) {
                this.pools[key].pool.pop()?.queue_free();
            }
        }
    }


    public CleanAll() {
        for (let key in this.pools) {
            for (let i = this.pools[key].pool.length - 1; i >= 0; --i) {
                this.pools[key].pool.pop()?.queue_free();
            }
        }
    }


    public SetMaxNum(key: string, num: number) {
        if (this.pools[key]) {
            this.pools[key] = new PoolObj();
        }
        this.pools[key].maxNum = num;
    }
}