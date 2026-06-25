import { Resource } from "godot";
import { Singleton } from "../Utils/Singleton";
import { MultiGodotAssetHandle } from "./AssetHandle/MultiGodotAssetHandle";
import { SingleGodotAssetHandle } from "./AssetHandle/SingleGodotAssetHandle";
import EasyAssetsLoader from "./EasyAssetsLoader";
import BaseAssetHandle from "./AssetHandle/BaseAssetHandle";
import { SingleRawAssetHandle } from "./AssetHandle/SingleRawAssetHandle";
import MultiRawAssetHandle from "./AssetHandle/MultiRawAssetHandle";

type ResourceType<T extends Resource = Resource> = { new(identifier?: any): T };

export class AssetsMgr extends Singleton<AssetsMgr> {

	private loader : EasyAssetsLoader = new EasyAssetsLoader();

    public async Init(...args: any[]): Promise<boolean> {
		return this.loader.Init(args);
    }

	public LoadAsset<T extends Resource>(path: string, type: ResourceType<T>): SingleGodotAssetHandle<T> | undefined {
		return this.loader.LoadGodotAsset<T>(path, type);
	}

	public LoadAssetsByKey<T extends Resource >(key: string, type: ResourceType<T>) : MultiGodotAssetHandle | undefined {
		return this.loader.LoadGodotAssetsByKey<T>(key, type);
	}

	public LoadAssetsByPaths<T extends Resource >(paths: string[], type: ResourceType<T> | null) : MultiGodotAssetHandle  | undefined {
		return this.loader.LoadGodotAssetsByPaths<T>(paths, type);
	}

	public LoadRawAsset(path: string): SingleRawAssetHandle | undefined {
		return this.loader.LoadRawAsset(path);
	}

	public LoadRawAssetsByKey(key: string) : MultiRawAssetHandle | undefined {
		return this.loader.LoadRawAssetsByKey(key);
	}

	public LoadRawAssetsByPaths(paths: string[]) : MultiRawAssetHandle  | undefined {
		return this.loader.LoadRawAssetsByPaths(paths);
	}

	public Release(handle : BaseAssetHandle) {
		this.loader.ReleaseHandle(handle);
	}
}
