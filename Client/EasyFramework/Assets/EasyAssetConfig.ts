
import { EasyConfig } from "../EasyConfig/EasyConfig";

/// <summary>
/// 资源开关配置
/// </summary
@EasyConfig({ name: "EasyAssetConfig", exportPath: "res://gen/easy_config/EasyAssetConfig.json" })
export class EasyAssetConfig {

    public constructor() {

    }

    public hotUpdate: boolean = true;

    public forceHotUpdate: boolean = false;

    public maxDownloadNum: number = 5;

    public requestVersionUrl: string = "";

    public instanceOverTime: number = 3000;
}
