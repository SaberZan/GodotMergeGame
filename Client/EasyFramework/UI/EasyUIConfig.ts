
import { EasyConfig } from "../EasyConfig/EasyConfig";

/// <summary>
/// 资源开关配置
/// </summary
@EasyConfig({ name: "EasyUIConfig", exportPath: "res://gen/easy_config/EasyUIConfig.json" })
export class EasyUIConfig {

    public constructor() {

    }

    public width: number = 1080;

    public height: number = 1920;
}
