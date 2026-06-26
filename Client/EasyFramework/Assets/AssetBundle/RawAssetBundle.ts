import { FileAccess, PackedByteArray, Resource } from "godot";
import EasyAssetsLoader from "../EasyAssetsLoader";
import EasyAssetBundle from "./EasyAssetBundle";

export class RawAssetBundle extends EasyAssetBundle {

    public constructor(loader: EasyAssetsLoader, index: number) {
        super(loader, index)
    }
    public LoadAsset<T extends Resource>(path: string, type: (new () => T) | string): T {
        throw new Error("Method not implemented.");
    }
    public LoadAssetAsync<T extends Resource>(path: string, type: (new () => T) | string): Promise<T> {
        throw new Error("Method not implemented.");
    }

    public LoadRawAsset(path: string): PackedByteArray | undefined {
        return FileAccess.get_file_as_bytes(path);
    }

    public LoadRawAssetAsync(path: string): Promise<PackedByteArray | undefined> {
        console.log("--------RawAssetBundle-LoadAsset---111- " + path);
        return new Promise((resolve) => {
            setInterval(() => {
                resolve(FileAccess.get_file_as_bytes(path));
            })
        })
    }

    public override Unload(value: boolean): void {

    }
}
