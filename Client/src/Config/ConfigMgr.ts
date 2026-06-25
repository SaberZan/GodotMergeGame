import { Singleton } from "../Utils/Singleton";
import * as Configs  from "./Data/Index";

export class ConfigMgr extends Singleton<ConfigMgr> {
	/**
	 * 读取配置
	 * @param {String} cfgName 配置模块名
	 * @param {String} keys SubKeys
	 */
	public Get(cfgName: string, ...keys: string[]) {
		let _ret;
		_ret = Configs[cfgName as keyof typeof Configs];

		if (!_ret) {
			//"配置读取错误: 模块不存在
			return null;
		}

		for (var i = 0; i < keys.length; i++) {
			_ret = _ret[keys[i] as keyof typeof _ret];
			if (_ret === undefined) {
				//配置读取错误
				return _ret;
			}
		}

		return _ret;
	}
}
