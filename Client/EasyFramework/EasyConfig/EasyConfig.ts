export interface EasyConfigOptions {
	name?: string;
	exportPath?: string;
}

export interface EasyConfigMetadata {
	name: string;
	exportPath: string;
}

export const EASY_CONFIG_METADATA_KEY = "__easy_config__";

type EasyConfigTarget = abstract new (...args: any[]) => any;

export function EasyConfig<T extends EasyConfigTarget>(target: T, context?: ClassDecoratorContext<T>): void;
export function EasyConfig(options?: string | EasyConfigOptions): <T extends EasyConfigTarget>(target: T, context?: ClassDecoratorContext<T>) => void;
export function EasyConfig(arg?: string | EasyConfigOptions | EasyConfigTarget, context?: ClassDecoratorContext<EasyConfigTarget>): any {
	if (typeof arg == "function") {
		applyEasyConfigMetadata(arg, undefined, context);
		return;
	}

	return function <T extends EasyConfigTarget>(target: T, decoratorContext?: ClassDecoratorContext<T>): void {
		applyEasyConfigMetadata(target, arg as string | EasyConfigOptions | undefined, decoratorContext as ClassDecoratorContext<EasyConfigTarget> | undefined);
	};
}

function applyEasyConfigMetadata(target: EasyConfigTarget, options?: string | EasyConfigOptions, _context?: ClassDecoratorContext<EasyConfigTarget>): void {
	let className = target.name || "EasyConfig";
	let name = className;
	let exportPath = "";

	if (typeof options == "string") {
		name = options;
	} else if (options != null) {
		if (options.name != null && options.name != "") name = options.name;
		if (options.exportPath != null && options.exportPath != "") exportPath = options.exportPath;
	}

	if (exportPath == "") {
		exportPath = "res://gen/easy_config/" + name + ".json";
	}

	(target as any)[EASY_CONFIG_METADATA_KEY] = { name, exportPath } as EasyConfigMetadata;
}

export function getEasyConfigMetadata(target: any): EasyConfigMetadata | null {
	if (target == null) return null;
	return target[EASY_CONFIG_METADATA_KEY] as EasyConfigMetadata ?? null;
}
