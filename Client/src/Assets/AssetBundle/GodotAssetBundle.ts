import { FileAccess, OS, PackedByteArray, PCKPacker, ProjectSettings, Resource, ResourceLoader } from "godot";
import EasyAssetBundle from "./EasyAssetBundle";
import EasyAssetsLoader from "../EasyAssetsLoader";
import { Const } from "../Const";

export default class GodotAssetBundle extends EasyAssetBundle {

    public constructor(loader: EasyAssetsLoader, index: number) {
        super(loader, index);

        if (OS.has_feature("editor")) {
            return;
        }

        let md5 = loader.catalogs.allEasyAssetBundleInfos[index].md5;
        let pckPath = md5.endsWith(".pck") ? md5 : Const.localAssetBundleFolder + md5 + ".pck";
        if (!FileAccess.file_exists(pckPath)) {
            pckPath = Const.localAssetBundleFolder + md5;
        }
        ProjectSettings.load_resource_pack(pckPath);
    }

    public LoadAsset<T extends Resource>(path: string, type: (new () => T) | string): T {
        if (typeof type == "string") {
            return <T>ResourceLoader.load(path, type);
        }
        else {
            return <T>ResourceLoader.load(path, type.name);
        }
    }
    public async LoadAssetAsync<T extends Resource>(path: string, type: (new () => T) | string): Promise<T> {
        if (typeof type == "string") {
            ResourceLoader.load_threaded_request(path, type);
            return new Promise((resolve) => {
                let status = ResourceLoader.load_threaded_get_status(path);
                if (status == ResourceLoader.ThreadLoadStatus.THREAD_LOAD_LOADED) {
                    resolve(<T>ResourceLoader.load_threaded_get(path));
                    return;
                }
                let interval = setInterval(() => {
                    let status = ResourceLoader.load_threaded_get_status(path);
                    if (status == ResourceLoader.ThreadLoadStatus.THREAD_LOAD_LOADED) {
                        resolve(<T>ResourceLoader.load_threaded_get(path));
                        clearInterval(interval);
                        return;
                    }
                })
            })
        }
        else {
            ResourceLoader.load_threaded_request(path, type.name);
            return new Promise((resolve) => {
                let status = ResourceLoader.load_threaded_get_status(path);
                if (status == ResourceLoader.ThreadLoadStatus.THREAD_LOAD_LOADED) {
                    resolve(<T>ResourceLoader.load_threaded_get(path));
                    return;
                }
                let interval = setInterval(() => {
                    let status = ResourceLoader.load_threaded_get_status(path);
                    if (status == ResourceLoader.ThreadLoadStatus.THREAD_LOAD_LOADED) {
                        resolve(<T>ResourceLoader.load_threaded_get(path));
                        clearInterval(interval);
                        return;
                    }
                })
            })
        }
    }

    public LoadRawAsset(path: string): PackedByteArray | undefined {
        throw new Error("Method not implemented.");
    }


    public LoadRawAssetAsync(path: string): Promise<PackedByteArray | undefined> {
        throw new Error("Method not implemented.");
    }
    public override Unload(value: boolean): void {
        
    }
}
