import { PackedByteArray, Resource } from "godot";
import EasyAssetsLoader from "../EasyAssetsLoader";

export default abstract class EasyAssetBundle {
	public loader: EasyAssetsLoader;

	public index: number;

	protected constructor(loader: EasyAssetsLoader, index: number) {
		this.loader = loader;
		this.index = index;
	}

	public abstract LoadAsset<T extends Resource>(path: string, type: (new () => T) | string): T

	public abstract LoadAssetAsync<T extends Resource>(path: string, type: (new () => T) | string): Promise<T>

	public abstract LoadRawAsset(path: string): PackedByteArray | undefined;

	public abstract LoadRawAssetAsync(path: string): Promise<PackedByteArray | undefined>;

	public abstract Unload(value: boolean): void;
}
