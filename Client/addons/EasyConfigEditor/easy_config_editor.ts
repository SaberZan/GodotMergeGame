import {
	Button,
	Callable,
	CheckBox,
	DirAccess,
	FileAccess,
	HBoxContainer,
	HSeparator,
	Label,
	LineEdit,
	OptionButton,
	ScrollContainer,
	VBoxContainer,
	Vector2,
} from "godot";
import { createClassBinder } from "godot.annotations";

type ConfigFieldType = "boolean" | "number" | "string";

interface ConfigField {
	name: string;
	type: ConfigFieldType;
	value: boolean | number | string;
}

interface ConfigClass {
	filePath: string;
	className: string;
	configName: string;
	exportPath: string;
	fields: ConfigField[];
}

var bind = createClassBinder();

@bind()
@bind.tool()
export default class EasyConfigEditor extends VBoxContainer {
	private _pathLabel!: Label;
	private _classSelect!: OptionButton;
	private _reloadBtn!: Button;
	private _scanBtn!: Button;
	private _exportBtn!: Button;
	private _fieldsBox!: VBoxContainer;
	private _statusLabel!: Label;

	private _filePath = "";
	private _source = "";
	private _classes: ConfigClass[] = [];
	private _selectedClassIndex = -1;
	private _dirty = false;

	_ready(): void {
		this._buildUI();
		this._scanProjectConfigs("");
	}

	private _buildUI(): void {
		let bar = new HBoxContainer();
		this.add_child(bar);

		let title = new Label();
		title.text = "Config";
		bar.add_child(title);

		this._pathLabel = new Label();
		this._pathLabel.text = "res://src";
		this._pathLabel.size_flags_horizontal = 3;
		bar.add_child(this._pathLabel);

		this._classSelect = new OptionButton();
		this._classSelect.disabled = true;
		this._classSelect.custom_minimum_size = new Vector2(220, 0);
		bar.add_child(this._classSelect);

		this._reloadBtn = new Button();
		this._reloadBtn.text = "Reload";
		this._reloadBtn.disabled = false;
		bar.add_child(this._reloadBtn);

		this._scanBtn = new Button();
		this._scanBtn.text = "Scan";
		bar.add_child(this._scanBtn);

		this._exportBtn = new Button();
		this._exportBtn.text = "Export";
		this._exportBtn.disabled = true;
		bar.add_child(this._exportBtn);

		this.add_child(new HSeparator());

		let scroll = new ScrollContainer();
		scroll.size_flags_horizontal = 3;
		scroll.size_flags_vertical = 3;
		this.add_child(scroll);

		this._fieldsBox = new VBoxContainer();
		this._fieldsBox.size_flags_horizontal = 3;
		scroll.add_child(this._fieldsBox);

		this.add_child(new HSeparator());

		this._statusLabel = new Label();
		this._statusLabel.text = "Ready";
		this.add_child(this._statusLabel);

		this._classSelect.item_selected.connect(Callable.create(this, "_onClassSelected") as any);
		this._reloadBtn.pressed.connect(Callable.create(this, "_onReload") as any);
		this._scanBtn.pressed.connect(Callable.create(this, "_onScan") as any);
		this._exportBtn.pressed.connect(Callable.create(this, "_onExport") as any);
	}

	private _onClassSelected(index: number): void {
		this._selectClass(index);
	}

	private _onReload(): void {
		this._scanProjectConfigs(this._getCurrentClass()?.className ?? "");
	}

	private _onScan(): void {
		this._scanProjectConfigs(this._getCurrentClass()?.className ?? "");
	}

	private _onExport(): void {
		let configClass = this._getCurrentClass();
		if (configClass == null) return;

		let dirPath = this._getParentDir(configClass.exportPath);
		if (dirPath != "" && !DirAccess.dir_exists_absolute(dirPath)) {
			DirAccess.make_dir_recursive_absolute(dirPath);
		}

		let file = FileAccess.open(configClass.exportPath, FileAccess.ModeFlags.WRITE);
		if (file == null) {
			this._setStatus("Export failed: cannot write " + configClass.exportPath);
			return;
		}

		file.store_string(JSON.stringify(this._buildExportObject(configClass), null, "\t"));
		file.close();
		this._dirty = false;
		this._setStatus("Exported " + configClass.configName + " to " + configClass.exportPath);
	}

	_can_drop_data(_at_position: Vector2, data: any): boolean {
		return this._getDroppedTsFiles(data).length > 0;
	}

	_drop_data(_at_position: Vector2, data: any): void {
		let files = this._getDroppedTsFiles(data);
		if (files.length == 0) {
			this._setStatus("Drop a .ts file");
			return;
		}
		this._loadFile(files[0]);
	}

	private _loadFile(path: string): void {
		let file = FileAccess.open(path, FileAccess.ModeFlags.READ);
		if (file == null) {
			this._setStatus("Load failed: cannot read " + path);
			return;
		}

		this._filePath = path;
		this._source = file.get_as_text();
		file.close();

		this._dirty = false;
		this._pathLabel.text = path;
		this._refreshParsedClasses("");

		if (this._classes.length > 0) {
			this._setStatus("Loaded " + this._classes.length + " EasyConfig class(es)");
		} else {
			this._setStatus("No @EasyConfig class found");
		}
	}

	private _refreshParsedClasses(selectedClassName: string): void {
		this._classes = this._parseConfigClasses(this._source, this._filePath);
		for (let configClass of this._classes) {
			this._applyExportedValues(configClass);
		}
		this._syncClassSelect();

		if (this._classes.length == 0) {
			this._selectedClassIndex = -1;
			this._exportBtn.disabled = true;
			this._rebuildFieldsUI();
			return;
		}

		let nextIndex = 0;
		if (selectedClassName != "") {
			for (let i = 0; i < this._classes.length; i++) {
				if (this._classes[i].className == selectedClassName) {
					nextIndex = i;
					break;
				}
			}
		}
		this._selectClass(nextIndex);
	}

	private _scanProjectConfigs(selectedClassName: string): void {
		let tsFiles = this._scanTsFiles("res://src");
		let classes: ConfigClass[] = [];
		for (let path of tsFiles) {
			let file = FileAccess.open(path, FileAccess.ModeFlags.READ);
			if (file == null) continue;
			let source = file.get_as_text();
			file.close();
			let parsed = this._parseConfigClasses(source, path);
			for (let configClass of parsed) {
				this._applyExportedValues(configClass);
				classes.push(configClass);
			}
		}

		this._filePath = "";
		this._source = "";
		this._classes = classes;
		this._dirty = false;
		this._pathLabel.text = "res://src";
		this._syncClassSelect();

		if (this._classes.length == 0) {
			this._selectedClassIndex = -1;
			this._exportBtn.disabled = true;
			this._rebuildFieldsUI();
			this._setStatus("No @EasyConfig class found");
			return;
		}

		let nextIndex = 0;
		if (selectedClassName != "") {
			for (let i = 0; i < this._classes.length; i++) {
				if (this._classes[i].className == selectedClassName) {
					nextIndex = i;
					break;
				}
			}
		}
		this._selectClass(nextIndex);
		this._setStatus("Loaded " + this._classes.length + " EasyConfig class(es)");
	}

	private _scanTsFiles(folderPath: string): string[] {
		let result: string[] = [];
		let dir = DirAccess.open(folderPath);
		if (dir == null) return result;

		dir.list_dir_begin();
		let entry = dir.get_next();
		while (entry != "") {
			if (entry == "." || entry == "..") {
				entry = dir.get_next();
				continue;
			}
			let fullPath = folderPath.endsWith("/") ? folderPath + entry : folderPath + "/" + entry;
			if (dir.current_is_dir()) {
				result.push(...this._scanTsFiles(fullPath));
			} else if (fullPath.toLowerCase().endsWith(".ts") && !fullPath.toLowerCase().endsWith(".ts.uid")) {
				result.push(fullPath);
			}
			entry = dir.get_next();
		}
		dir.list_dir_end();
		return result;
	}

	private _parseConfigClasses(source: string, filePath: string): ConfigClass[] {
		let classes: ConfigClass[] = [];
		let classRegex = /@EasyConfig(?:\s*\(([\s\S]*?)\))?\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)[^\{]*\{/g;
		let match: RegExpExecArray | null;

		while ((match = classRegex.exec(source)) != null) {
			let decoratorArgs = match[1] ?? "";
			let className = match[2];
			let openBraceIndex = match.index + match[0].length - 1;
			let closeBraceIndex = this._findMatchingBrace(source, openBraceIndex);
			if (closeBraceIndex < 0) continue;

			let body = source.substring(openBraceIndex + 1, closeBraceIndex);
			let meta = this._parseEasyConfigArgs(decoratorArgs, className);
			classes.push({
				filePath,
				className,
				configName: meta.configName,
				exportPath: meta.exportPath,
				fields: this._parseFields(body),
			});
		}

		return classes;
	}

	private _applyExportedValues(configClass: ConfigClass): void {
		let file = FileAccess.open(configClass.exportPath, FileAccess.ModeFlags.READ);
		if (file == null) return;

		let text = file.get_as_text();
		file.close();

		let data: any;
		try {
			data = JSON.parse(text);
		} catch (_e) {
			return;
		}
		if (data == null || typeof data != "object") return;

		for (let field of configClass.fields) {
			if (data[field.name] === undefined) continue;
			let value = data[field.name];
			if (field.type == "boolean" && typeof value == "boolean") {
				field.value = value;
			} else if (field.type == "number" && typeof value == "number" && Number.isFinite(value)) {
				field.value = value;
			} else if (field.type == "string" && typeof value == "string") {
				field.value = value;
			}
		}
	}

	private _parseFields(source: string): ConfigField[] {
		let fields: ConfigField[] = [];
		let lines = source.split(/\r\n|\n|\r/);
		let fieldRegex = /public\s+([A-Za-z_$][\w$]*)\s*:\s*(boolean|number|string)\s*=\s*(.*?);/;

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			let match = fieldRegex.exec(line);
			if (match == null) continue;

			let type = match[2] as ConfigFieldType;
			let parsedValue = this._parseValue(type, match[3]);
			if (parsedValue == null) continue;

			fields.push({
				name: match[1],
				type,
				value: parsedValue,
			});
		}

		return fields;
	}

	private _parseValue(type: ConfigFieldType, raw: string): boolean | number | string | null {
		let text = raw.trim();
		if (type == "boolean") {
			if (text == "true") return true;
			if (text == "false") return false;
			return null;
		}
		if (type == "number") {
			let n = Number(text);
			return Number.isFinite(n) ? n : null;
		}
		return this._parseStringLiteral(text);
	}

	private _parseStringLiteral(text: string): string | null {
		if (text.length < 2) return null;
		let quote = text.charAt(0);
		if ((quote != "\"" && quote != "'") || text.charAt(text.length - 1) != quote) return null;
		try {
			if (quote == "\"") return JSON.parse(text) as string;
			let inner = text.substring(1, text.length - 1);
			return inner.replace(/\\([\\'"nrt])/g, (_all: string, escaped: string) => {
				switch (escaped) {
					case "n": return "\n";
					case "r": return "\r";
					case "t": return "\t";
					default: return escaped;
				}
			});
		} catch (_e) {
			return null;
		}
	}

	private _rebuildFieldsUI(): void {
		this._clearFieldsUI();
		let fields = this._getCurrentFields();

		if (this._classes.length == 0) {
			let empty = new Label();
			empty.text = "No @EasyConfig class found";
			this._fieldsBox.add_child(empty);
			return;
		}

		if (fields.length == 0) {
			let empty = new Label();
			empty.text = "No editable public boolean, number, or string fields found";
			this._fieldsBox.add_child(empty);
			return;
		}

		for (let i = 0; i < fields.length; i++) {
			let field = fields[i];
			let row = new HBoxContainer();
			row.size_flags_horizontal = 3;
			this._fieldsBox.add_child(row);

			let name = new Label();
			name.text = field.name + " : " + field.type;
			name.custom_minimum_size = new Vector2(220, 0);
			row.add_child(name);

			if (field.type == "boolean") {
				let input = new CheckBox();
				input.set_pressed_no_signal(field.value as boolean);
				input.toggled.connect(Callable.create((pressed: boolean) => {
					let currentField = this._getCurrentFields()[i];
					if (currentField == null) return;
					currentField.value = pressed;
					this._markDirty();
				}) as any);
				row.add_child(input);
			} else {
				let input = new LineEdit();
				input.text = String(field.value);
				input.size_flags_horizontal = 3;
				input.text_changed.connect(Callable.create((text: string) => {
					this._onTextFieldChanged(i, text);
				}) as any);
				row.add_child(input);
			}
		}
	}

	private _onTextFieldChanged(index: number, text: string): void {
		let field = this._getCurrentFields()[index];
		if (field == null) return;
		if (field.type == "number") {
			let n = Number(text);
			if (!Number.isFinite(n)) {
				this._setStatus("Invalid number: " + field.name);
				return;
			}
			field.value = n;
		} else {
			field.value = text;
		}
		this._markDirty();
	}

	private _markDirty(): void {
		this._dirty = true;
		this._setStatus("Changed, export to write json");
	}

	private _clearFieldsUI(): void {
		while (this._fieldsBox.get_child_count() > 0) {
			let child = this._fieldsBox.get_child(0);
			this._fieldsBox.remove_child(child);
			child.queue_free();
		}
	}

	private _setStatus(text: string): void {
		this._statusLabel.text = (this._dirty ? "Unsaved | " : "") + text;
	}

	private _getDroppedTsFiles(data: any): string[] {
		let d: any = data;
		if (d != null && typeof d.proxy === "function") {
			d = d.proxy();
		}

		let filesRaw: any = null;
		if (d != null) {
			if (d["files"] !== undefined) {
				filesRaw = d["files"];
			} else if (typeof d.get === "function") {
				filesRaw = d.get("files");
			}
		}

		let files = filesRaw != null ? this._normaliseStringArray(filesRaw) : [];
		if (files.length == 0) files = this._normaliseStringArray(d != null ? d : data);
		return files.filter(path => path.toLowerCase().endsWith(".ts"));
	}

	private _normaliseStringArray(value: any): string[] {
		if (value == null) return [];
		if (Array.isArray(value)) return value.map(x => String(x));
		if (typeof value.size === "function" && typeof value.get_indexed === "function") {
			let result: string[] = [];
			let count = value.size();
			for (let i = 0; i < count; i++) {
				let item = value.get_indexed(i);
				if (item != null) result.push(String(item));
			}
			return result;
		}
		if (typeof value.proxy === "function") {
			let proxy = value.proxy();
			if (Array.isArray(proxy)) return proxy.map(x => String(x));
		}
		if (typeof value == "string") return [value];
		return [];
	}

	private _syncClassSelect(): void {
		this._classSelect.clear();
		this._classSelect.disabled = this._classes.length == 0;
		for (let i = 0; i < this._classes.length; i++) {
			let configClass = this._classes[i];
			this._classSelect.add_item(configClass.configName + " (" + configClass.className + ")", i);
		}
	}

	private _selectClass(index: number): void {
		if (index < 0 || index >= this._classes.length) return;
		this._selectedClassIndex = index;
		this._classSelect.select(index);
		this._applyExportedValues(this._classes[index]);
		this._pathLabel.text = this._classes[index].filePath;
		this._exportBtn.disabled = false;
		this._rebuildFieldsUI();
	}

	private _getCurrentClass(): ConfigClass | null {
		if (this._selectedClassIndex < 0 || this._selectedClassIndex >= this._classes.length) return null;
		return this._classes[this._selectedClassIndex];
	}

	private _getCurrentFields(): ConfigField[] {
		let configClass = this._getCurrentClass();
		return configClass != null ? configClass.fields : [];
	}

	private _buildExportObject(configClass: ConfigClass): Record<string, boolean | number | string> {
		let data: Record<string, boolean | number | string> = {};
		for (let field of configClass.fields) {
			data[field.name] = field.value;
		}
		return data;
	}

	private _parseEasyConfigArgs(args: string, className: string): { configName: string; exportPath: string } {
		let configName = className;
		let exportPath = "";
		let text = args.trim();

		if (text.length > 0) {
			let stringMatch = /^(?:"([^"]+)"|'([^']+)')$/.exec(text);
			if (stringMatch != null) {
				configName = stringMatch[1] ?? stringMatch[2] ?? className;
			} else {
				let nameMatch = /name\s*:\s*(?:"([^"]+)"|'([^']+)')/.exec(text);
				let exportPathMatch = /exportPath\s*:\s*(?:"([^"]+)"|'([^']+)')/.exec(text);
				if (nameMatch != null) configName = nameMatch[1] ?? nameMatch[2] ?? className;
				if (exportPathMatch != null) exportPath = exportPathMatch[1] ?? exportPathMatch[2] ?? "";
			}
		}

		if (exportPath == "") exportPath = "res://gen/easy_config/" + configName + ".json";
		return { configName, exportPath };
	}

	private _findMatchingBrace(source: string, openBraceIndex: number): number {
		let depth = 0;
		let quote = "";
		let escaped = false;

		for (let i = openBraceIndex; i < source.length; i++) {
			let ch = source.charAt(i);
			if (quote != "") {
				if (escaped) {
					escaped = false;
				} else if (ch == "\\") {
					escaped = true;
				} else if (ch == quote) {
					quote = "";
				}
				continue;
			}

			if (ch == "\"" || ch == "'" || ch == "`") {
				quote = ch;
			} else if (ch == "{") {
				depth++;
			} else if (ch == "}") {
				depth--;
				if (depth == 0) return i;
			}
		}

		return -1;
	}

	private _getParentDir(path: string): string {
		let index = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
		return index >= 0 ? path.substring(0, index) : "";
	}
}
