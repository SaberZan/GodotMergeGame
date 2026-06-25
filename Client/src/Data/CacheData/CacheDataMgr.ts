import { Singleton } from "../../Utils/Singleton";
import * as Datas from "./Data/Index";
import { CacheData } from "./Data/CacheData";
import { LoggerMgr } from "../../Logger/LoggerMgr";
import { Serialize } from "../../Extra/Serialize/Serialize";
import { FileAccess } from "godot";

type CacheDataConstructor = new () => CacheData;

export class CacheDataMgr extends Singleton<CacheDataMgr> {

    private cacheDatas: { [key: string]: CacheData } = {};

    public ClearAll() {
        this.cacheDatas = {}
    }

    public Get<T extends CacheData>(key: string): T {
        if(!this.cacheDatas[key]) {
            if (Object.prototype.hasOwnProperty.call(Datas, key)) {
                const element = Datas[key as keyof typeof Datas] as CacheDataConstructor;
                this.cacheDatas[key] = new element();
            }
        }
        return <T>this.cacheDatas[key];
    }
}
