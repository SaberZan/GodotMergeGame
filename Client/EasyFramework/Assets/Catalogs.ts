
/// <summary>
/// 在所有AB包被的资源信息

import { AudioStream, Font, ImageTexture, Material, PackedScene, Resource, Script, Shader, Texture2D } from "godot";
import EasyAssetBundleInfo from "./AssetInfo/EasyAssetBundleInfo";
import EasyAssetInfo from "./AssetInfo/EasyAssetInfo";

type ResourceType<T extends Resource = Resource> = { new(identifier?: any): T };

const GodotResourceTypes: { [key: string]: ResourceType | undefined } = {
    AudioStream,
    Font,
    ImageTexture,
    Material,
    PackedScene,
    Resource,
    Script,
    Shader,
    Texture2D,
};

/// </summary>
export default class Catalogs {
    /// <summary>
    /// 版本号
    /// </summary>
    public version: number = 0;

    /// <summary>
    /// 版本号
    /// </summary>
    public versionCode: number = 0;

    /// <summary>
    /// 更新地址
    /// </summary>
    public updateUrls: string[] = [];

    /// <summary>
    /// ab资源信息列表
    /// </summary>
    public allEasyAssetBundleInfos: EasyAssetBundleInfo[] = [];

    /// <summary>
    /// 主动调用的资源信息列表
    /// </summary>
    public allActiveEasyAssetInfos: EasyAssetInfo[] = [];

    /// <summary>
    /// 被动依赖的资源信息列表
    /// </summary>
    public allPassiveEasyAssetInfos: EasyAssetInfo[] = [];

    /// <summary>
    /// 资源类型列表
    /// </summary>
    public assemblyQualifiedNames: ResourceType[] = [];

    /// <summary>
    /// 资源类型列表
    /// </summary>
    public types: { [key: number]: ResourceType } = {};

    /// <summary>
    /// 所有主动依赖数据的字典库
    /// </summary>
    public allActiveEasyAssetInfoDic: { [key: number]: { [key: string]: EasyAssetInfo } } = {};

    public ab2EasyAssetInfoDic: { [key: number]: EasyAssetInfo[] } = {};

    public static FromJson(json: string): Catalogs {
        return Catalogs.FromObject(JSON.parse(json));
    }

    public static FromObject(data: any): Catalogs {
        let catalogs = new Catalogs();
        if (data == null || typeof data != "object") {
            catalogs.Init();
            return catalogs;
        }

        catalogs.version = Catalogs.ToNumber(data.version, 0);
        catalogs.versionCode = Catalogs.ToNumber(data.versionCode, 0);
        catalogs.updateUrls = Catalogs.ToStringArray(data.updateUrls);
        catalogs.assemblyQualifiedNames = Catalogs.ParseResourceTypes(data.assemblyQualifiedNames);
        catalogs.allEasyAssetBundleInfos = Catalogs.ParseEasyAssetBundleInfos(data.allEasyAssetBundleInfos);

        let groupIndexMap: { [key: string]: number } = {};
        for (let i = 0; i < catalogs.allEasyAssetBundleInfos.length; i++) {
            groupIndexMap[catalogs.allEasyAssetBundleInfos[i].abName] = i;
        }

        let activeSource = Catalogs.ToRecord(data.allActiveEasyAssetInfos);
        let passiveSource = Catalogs.ToRecord(data.allPassiveEasyAssetInfos);
        catalogs.allActiveEasyAssetInfos = Catalogs.ParseEasyAssetInfos(activeSource, groupIndexMap, activeSource, passiveSource);
        catalogs.allPassiveEasyAssetInfos = Catalogs.ParseEasyAssetInfos(passiveSource, groupIndexMap, activeSource, passiveSource);
        catalogs.Init();
        return catalogs;
    }

    private static ParseResourceTypes(source: any): ResourceType[] {
        let result: ResourceType[] = [];
        for (let typeName of Catalogs.ToStringArray(source)) {
            let type = GodotResourceTypes[typeName];
            if (type == null) {
                console.warn("Catalogs: unknown resource type " + typeName + ", fallback to Resource");
                type = Resource;
            }
            result.push(type);
        }
        return result;
    }

    private static ParseEasyAssetBundleInfos(source: any): EasyAssetBundleInfo[] {
        let result: EasyAssetBundleInfo[] = [];
        let records = Catalogs.ToRecord(source);
        for (let key of Object.keys(records)) {
            let raw = records[key];
            let info = new EasyAssetBundleInfo();
            info.easyAssetBundleType = Catalogs.ToNumber(raw?.easyAssetBundleType, info.easyAssetBundleType) as any;
            info.abName = Catalogs.ToString(raw?.abName, key);
            info.md5 = Catalogs.ToString(raw?.md5, "");
            info.size = Catalogs.ToNumber(raw?.size, 0);
            info.crc = Catalogs.ToNumber(raw?.crc, 0);
            info.packages = Catalogs.ToStringArray(raw?.packages);
            info.location = Catalogs.ToNumber(raw?.location, info.location) as any;
            info.isEncrypt = !!raw?.isEncrypt;
            info.abDownloadPriority = Catalogs.ToNumber(raw?.abDownloadPriority, info.abDownloadPriority) as any;
            result.push(info);
        }
        return result;
    }

    private static ParseEasyAssetInfos(source: { [key: string]: any }, groupIndexMap: { [key: string]: number }, activeSource: { [key: string]: any }, passiveSource: { [key: string]: any }): EasyAssetInfo[] {
        let result: EasyAssetInfo[] = [];
        for (let asset of Object.keys(source)) {
            let raw = source[asset];
            let info = new EasyAssetInfo();
            let ownIndexes = Catalogs.ResolveGroupIndexes(raw?.needGroup, groupIndexMap);
            let depIndexes = Catalogs.ResolveDependencyIndexes(raw?.deps, groupIndexMap, activeSource, passiveSource);

            info.asset = asset;
            info.uid = Catalogs.ToString(raw?.uid, "");
            info.abIndex = ownIndexes.length > 0 ? ownIndexes[0] : -1;
            info.needABIndexes = Catalogs.UniqueNumbers(ownIndexes.concat(depIndexes));
            info.typeIndex = Catalogs.ToNumber(raw?.typeIndex, -1);
            info.changeTag = Catalogs.ToNumber(raw?.changeTag, -1);
            info.isRaw = !!raw?.isRaw;
            info.offset = Catalogs.ToNumber(raw?.offset, 0);
            info.size = Catalogs.ToNumber(raw?.size, 0);
            result.push(info);
        }
        return result;
    }

    private static ResolveDependencyIndexes(deps: any, groupIndexMap: { [key: string]: number }, activeSource: { [key: string]: any }, passiveSource: { [key: string]: any }): number[] {
        let result: number[] = [];
        for (let dep of Catalogs.ToStringArray(deps)) {
            let depRaw = activeSource[dep] ?? passiveSource[dep];
            if (depRaw == null) continue;
            result = result.concat(Catalogs.ResolveGroupIndexes(depRaw.needGroup, groupIndexMap));
        }
        return result;
    }

    private static ResolveGroupIndexes(groups: any, groupIndexMap: { [key: string]: number }): number[] {
        let result: number[] = [];
        for (let groupName of Catalogs.ToStringArray(groups)) {
            let index = groupIndexMap[groupName];
            if (index != null) result.push(index);
        }
        return Catalogs.UniqueNumbers(result);
    }

    private static ToRecord(value: any): { [key: string]: any } {
        if (value == null || typeof value != "object") return {};
        if (Array.isArray(value)) {
            let record: { [key: string]: any } = {};
            for (let i = 0; i < value.length; i++) record[String(i)] = value[i];
            return record;
        }
        return value as { [key: string]: any };
    }

    private static ToStringArray(value: any): string[] {
        if (Array.isArray(value)) return value.map(item => String(item));
        return [];
    }

    private static UniqueNumbers(values: number[]): number[] {
        let result: number[] = [];
        for (let value of values) {
            if (value >= 0 && result.indexOf(value) < 0) result.push(value);
        }
        return result;
    }

    private static ToString(value: any, fallback: string): string {
        return value == null ? fallback : String(value);
    }

    private static ToNumber(value: any, fallback: number): number {
        let numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : fallback;
    }

    public Init() {
        this.allActiveEasyAssetInfoDic = {};
        this.ab2EasyAssetInfoDic = {};
        for (let i = 0; i < this.allActiveEasyAssetInfos.length; i++) {
            let easyAssetInfo: EasyAssetInfo = this.allActiveEasyAssetInfos[i];
            let assetNameLength = easyAssetInfo.asset.length;
            if (!this.allActiveEasyAssetInfoDic[assetNameLength]) {
                this.allActiveEasyAssetInfoDic[assetNameLength] = {};
            }
            this.allActiveEasyAssetInfoDic[assetNameLength][easyAssetInfo.asset] = easyAssetInfo;
            if (!this.ab2EasyAssetInfoDic[easyAssetInfo.abIndex]) {
                this.ab2EasyAssetInfoDic[easyAssetInfo.abIndex] = [];
            }
            this.ab2EasyAssetInfoDic[easyAssetInfo.abIndex].push(easyAssetInfo);
        }
    }

    /// <summary>
    /// 获取AB包信息对象
    /// </summary>
    /// <param name="abName">ab包名</param>
    /// <param name="index">下标</param>
    /// <returns>信息对象</returns>
    public GetEasyAssetBundleInfoByName(abName: string): [EasyAssetBundleInfo, number] | undefined {
        for (let i = 0; i < this.allEasyAssetBundleInfos.length; i++) {
            let easyAssetBundleInfo = this.allEasyAssetBundleInfos[i];
            if (easyAssetBundleInfo.abName.localeCompare(abName, undefined, { sensitivity: 'accent' })) {
                return [easyAssetBundleInfo, i];
            }
        }
        return undefined;
    }

    /// <summary>
    /// 获取AB包信息对象
    /// </summary>
    /// <param name="md5">abmd5</param>
    /// <returns>信息对象</returns>
    public GetEasyAssetBundleInfoByMD5(md5: string): [EasyAssetBundleInfo, number] | undefined {
        for (let i = 0; i < this.allEasyAssetBundleInfos.length; i++) {
            let easyAssetBundleInfo = this.allEasyAssetBundleInfos[i];
            if (easyAssetBundleInfo.md5 == md5) {
                return [easyAssetBundleInfo, i];
            }
        }
        return undefined;
    }

    /// <summary>
    /// 获取AB包信息对象
    /// </summary>
    /// <param name="index">下标</param>
    /// <returns>信息对象</returns>
    public GetEasyAssetBundleInfoByIndex(index: number): EasyAssetBundleInfo | undefined {
        if (this.allEasyAssetBundleInfos.length > index) {
            return this.allEasyAssetBundleInfos[index];
        }
        return undefined;
    }

    /// <summary>
    /// 获取资源对象信息
    /// </summary>
    /// <param name="assetName">包内资源名称</param>
    /// <param name="index">下标</param>
    /// <returns>该AB包信息对象</returns>
    public GetEasyAssetBundleInfoByAsset(assetName: string): EasyAssetBundleInfo | undefined {
        let easyAssetInfo = this.GetEasyAssetInfoByAsset(assetName);
        if (easyAssetInfo != null) {
            return this.GetEasyAssetBundleInfoByIndex(easyAssetInfo.abIndex);
        }
        return undefined;
    }

    /// <summary>
    /// 获取所有资源名，通过AB名称
    /// </summary>
    /// <param name="assetName">包内资源名称</param>
    /// <returns>所有资源名列表</returns>
    public GetEasyAssetInfoByAsset(assetName: string): EasyAssetInfo | undefined {
        let assetNameLength = assetName.length;
        for(let key in this.allActiveEasyAssetInfoDic) {
        }
        if (this.allActiveEasyAssetInfoDic[assetNameLength]) {
            return this.allActiveEasyAssetInfoDic[assetNameLength][assetName];
        }
        return undefined;
    }

    /// <summary>
    /// 获取所有资源名，通过AB名称
    /// </summary>
    /// <param name="abName">AB包名称</param>
    /// <returns>所有资源名列表</returns>
    public GetAllEasyAssetInfoByEasyAssetBundleName(abName: string): EasyAssetInfo[] {
        let index = this.allEasyAssetBundleInfos.findIndex(abInfo => abInfo.abName.localeCompare(abName, undefined, { sensitivity: 'accent' }));
        return this.ab2EasyAssetInfoDic[index];
    }

    /// <summary>
    /// 获取所有资源名，通过AB名称
    /// </summary>
    /// <param name="md5">包内资源名称</param>
    /// <returns>所有资源名列表</returns>
    public GetAllEasyAssetInfoByEasyAssetBundleMD5(md5: string): EasyAssetInfo[] {
        let index = this.allEasyAssetBundleInfos.findIndex(abInfo => abInfo.md5.localeCompare(md5, undefined, { sensitivity: 'accent' }));
        return this.ab2EasyAssetInfoDic[index];
    }

    /// <summary>
    /// 获取所有资源名，通过AB名称
    /// </summary>
    /// <param name="assetName">AB包名称</param>
    /// <returns>所有资源名列表</returns>
    public GetTypeByAssetName(assetName: string): ResourceType  | undefined {
        var easyAssetInfo = this.GetEasyAssetInfoByAsset(assetName);
        if (easyAssetInfo != null) {
            return this.GetTypeByAssetTypeIndex(easyAssetInfo.typeIndex);
        }
        return undefined;
    }

    /// <summary>
    /// 获取所有资源名，通过index
    /// </summary>
    /// <param name="index">index</param>
    /// <returns>所有资源名列表</returns>
    public GetTypeByAssetTypeIndex(index: number): ResourceType | undefined {
        if (index < 0 || index >= this.assemblyQualifiedNames.length) {
            return undefined;
        }
        if (!this.types[index]) {
            var type = this.assemblyQualifiedNames[index];
            this.types[index] = type;
        }
        return this.types[index];
    }

    /// <summary>
    /// 获取资源ab包依赖
    /// </summary>
    /// <param name="assetName">资源名</param>
    /// <returns>所有资源名列表</returns>
    public GetDependEasyAssetBundleIndexesByAssetName(assetName: string): number[] | undefined {
        var easyAssetInfo = this.GetEasyAssetInfoByAsset(assetName);
        if (easyAssetInfo) {
            return easyAssetInfo.needABIndexes;
        }
        return undefined;
    }
}
