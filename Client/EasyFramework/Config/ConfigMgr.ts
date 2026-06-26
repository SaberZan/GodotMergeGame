import { Singleton } from "../Utils/Singleton";

export class ConfigMgr extends Singleton<ConfigMgr> {

	private Configs: {[key:string]:object} = {}

	public Register(configs:{[key:string]:object} ) {
		this.Configs = Object.assign({}, this.Configs , configs);
	}

	/**
	 * 读取配置
	 * @param {String} moduleName 配置模块名
	 * @param {String} cfgName 配置表名
	 * @param {String} keys SubKeys
	 */
	public Get(cfgName: string, ...keys: string[]) {
		let _ret;
		_ret = this.Configs[cfgName as keyof typeof this.Configs];

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
