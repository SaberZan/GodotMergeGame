"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
const godot_1 = require("godot");
const godot_annotations_1 = require("godot.annotations");
var bind = (0, godot_annotations_1.createClassBinder)();
let EasyConfigEditor = (() => {
    let _classDecorators = [bind(), bind.tool()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = godot_1.VBoxContainer;
    var EasyConfigEditor = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EasyConfigEditor = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        _pathLabel;
        _classSelect;
        _reloadBtn;
        _scanBtn;
        _exportBtn;
        _fieldsBox;
        _statusLabel;
        _filePath = "";
        _source = "";
        _classes = [];
        _selectedClassIndex = -1;
        _dirty = false;
        _ready() {
            this._buildUI();
            this._scanProjectConfigs("");
        }
        _buildUI() {
            let bar = new godot_1.HBoxContainer();
            this.add_child(bar);
            let title = new godot_1.Label();
            title.text = "Config";
            bar.add_child(title);
            this._pathLabel = new godot_1.Label();
            this._pathLabel.text = "res://src";
            this._pathLabel.size_flags_horizontal = 3;
            bar.add_child(this._pathLabel);
            this._classSelect = new godot_1.OptionButton();
            this._classSelect.disabled = true;
            this._classSelect.custom_minimum_size = new godot_1.Vector2(220, 0);
            bar.add_child(this._classSelect);
            this._reloadBtn = new godot_1.Button();
            this._reloadBtn.text = "Reload";
            this._reloadBtn.disabled = false;
            bar.add_child(this._reloadBtn);
            this._scanBtn = new godot_1.Button();
            this._scanBtn.text = "Scan";
            bar.add_child(this._scanBtn);
            this._exportBtn = new godot_1.Button();
            this._exportBtn.text = "Export";
            this._exportBtn.disabled = true;
            bar.add_child(this._exportBtn);
            this.add_child(new godot_1.HSeparator());
            let scroll = new godot_1.ScrollContainer();
            scroll.size_flags_horizontal = 3;
            scroll.size_flags_vertical = 3;
            this.add_child(scroll);
            this._fieldsBox = new godot_1.VBoxContainer();
            this._fieldsBox.size_flags_horizontal = 3;
            scroll.add_child(this._fieldsBox);
            this.add_child(new godot_1.HSeparator());
            this._statusLabel = new godot_1.Label();
            this._statusLabel.text = "Ready";
            this.add_child(this._statusLabel);
            this._classSelect.item_selected.connect(godot_1.Callable.create(this, "_onClassSelected"));
            this._reloadBtn.pressed.connect(godot_1.Callable.create(this, "_onReload"));
            this._scanBtn.pressed.connect(godot_1.Callable.create(this, "_onScan"));
            this._exportBtn.pressed.connect(godot_1.Callable.create(this, "_onExport"));
        }
        _onClassSelected(index) {
            this._selectClass(index);
        }
        _onReload() {
            this._scanProjectConfigs(this._getCurrentClass()?.className ?? "");
        }
        _onScan() {
            this._scanProjectConfigs(this._getCurrentClass()?.className ?? "");
        }
        _onExport() {
            let configClass = this._getCurrentClass();
            if (configClass == null)
                return;
            let dirPath = this._getParentDir(configClass.exportPath);
            if (dirPath != "" && !godot_1.DirAccess.dir_exists_absolute(dirPath)) {
                godot_1.DirAccess.make_dir_recursive_absolute(dirPath);
            }
            let file = godot_1.FileAccess.open(configClass.exportPath, godot_1.FileAccess.ModeFlags.WRITE);
            if (file == null) {
                this._setStatus("Export failed: cannot write " + configClass.exportPath);
                return;
            }
            file.store_string(JSON.stringify(this._buildExportObject(configClass), null, "\t"));
            file.close();
            this._dirty = false;
            this._setStatus("Exported " + configClass.configName + " to " + configClass.exportPath);
        }
        _can_drop_data(_at_position, data) {
            return this._getDroppedTsFiles(data).length > 0;
        }
        _drop_data(_at_position, data) {
            let files = this._getDroppedTsFiles(data);
            if (files.length == 0) {
                this._setStatus("Drop a .ts file");
                return;
            }
            this._loadFile(files[0]);
        }
        _loadFile(path) {
            let file = godot_1.FileAccess.open(path, godot_1.FileAccess.ModeFlags.READ);
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
            }
            else {
                this._setStatus("No @EasyConfig class found");
            }
        }
        _refreshParsedClasses(selectedClassName) {
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
        _scanProjectConfigs(selectedClassName) {
            let tsFiles = this._scanTsFiles("res://src");
            let classes = [];
            for (let path of tsFiles) {
                let file = godot_1.FileAccess.open(path, godot_1.FileAccess.ModeFlags.READ);
                if (file == null)
                    continue;
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
        _scanTsFiles(folderPath) {
            let result = [];
            let dir = godot_1.DirAccess.open(folderPath);
            if (dir == null)
                return result;
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
                }
                else if (fullPath.toLowerCase().endsWith(".ts") && !fullPath.toLowerCase().endsWith(".ts.uid")) {
                    result.push(fullPath);
                }
                entry = dir.get_next();
            }
            dir.list_dir_end();
            return result;
        }
        _parseConfigClasses(source, filePath) {
            let classes = [];
            let classRegex = /@EasyConfig(?:\s*\(([\s\S]*?)\))?\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)[^\{]*\{/g;
            let match;
            while ((match = classRegex.exec(source)) != null) {
                let decoratorArgs = match[1] ?? "";
                let className = match[2];
                let openBraceIndex = match.index + match[0].length - 1;
                let closeBraceIndex = this._findMatchingBrace(source, openBraceIndex);
                if (closeBraceIndex < 0)
                    continue;
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
        _applyExportedValues(configClass) {
            let file = godot_1.FileAccess.open(configClass.exportPath, godot_1.FileAccess.ModeFlags.READ);
            if (file == null)
                return;
            let text = file.get_as_text();
            file.close();
            let data;
            try {
                data = JSON.parse(text);
            }
            catch (_e) {
                return;
            }
            if (data == null || typeof data != "object")
                return;
            for (let field of configClass.fields) {
                if (data[field.name] === undefined)
                    continue;
                let value = data[field.name];
                if (field.type == "boolean" && typeof value == "boolean") {
                    field.value = value;
                }
                else if (field.type == "number" && typeof value == "number" && Number.isFinite(value)) {
                    field.value = value;
                }
                else if (field.type == "string" && typeof value == "string") {
                    field.value = value;
                }
            }
        }
        _parseFields(source) {
            let fields = [];
            let lines = source.split(/\r\n|\n|\r/);
            let fieldRegex = /public\s+([A-Za-z_$][\w$]*)\s*:\s*(boolean|number|string)\s*=\s*(.*?);/;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let match = fieldRegex.exec(line);
                if (match == null)
                    continue;
                let type = match[2];
                let parsedValue = this._parseValue(type, match[3]);
                if (parsedValue == null)
                    continue;
                fields.push({
                    name: match[1],
                    type,
                    value: parsedValue,
                });
            }
            return fields;
        }
        _parseValue(type, raw) {
            let text = raw.trim();
            if (type == "boolean") {
                if (text == "true")
                    return true;
                if (text == "false")
                    return false;
                return null;
            }
            if (type == "number") {
                let n = Number(text);
                return Number.isFinite(n) ? n : null;
            }
            return this._parseStringLiteral(text);
        }
        _parseStringLiteral(text) {
            if (text.length < 2)
                return null;
            let quote = text.charAt(0);
            if ((quote != "\"" && quote != "'") || text.charAt(text.length - 1) != quote)
                return null;
            try {
                if (quote == "\"")
                    return JSON.parse(text);
                let inner = text.substring(1, text.length - 1);
                return inner.replace(/\\([\\'"nrt])/g, (_all, escaped) => {
                    switch (escaped) {
                        case "n": return "\n";
                        case "r": return "\r";
                        case "t": return "\t";
                        default: return escaped;
                    }
                });
            }
            catch (_e) {
                return null;
            }
        }
        _rebuildFieldsUI() {
            this._clearFieldsUI();
            let fields = this._getCurrentFields();
            if (this._classes.length == 0) {
                let empty = new godot_1.Label();
                empty.text = "No @EasyConfig class found";
                this._fieldsBox.add_child(empty);
                return;
            }
            if (fields.length == 0) {
                let empty = new godot_1.Label();
                empty.text = "No editable public boolean, number, or string fields found";
                this._fieldsBox.add_child(empty);
                return;
            }
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                let row = new godot_1.HBoxContainer();
                row.size_flags_horizontal = 3;
                this._fieldsBox.add_child(row);
                let name = new godot_1.Label();
                name.text = field.name + " : " + field.type;
                name.custom_minimum_size = new godot_1.Vector2(220, 0);
                row.add_child(name);
                if (field.type == "boolean") {
                    let input = new godot_1.CheckBox();
                    input.set_pressed_no_signal(field.value);
                    input.toggled.connect(godot_1.Callable.create((pressed) => {
                        let currentField = this._getCurrentFields()[i];
                        if (currentField == null)
                            return;
                        currentField.value = pressed;
                        this._markDirty();
                    }));
                    row.add_child(input);
                }
                else {
                    let input = new godot_1.LineEdit();
                    input.text = String(field.value);
                    input.size_flags_horizontal = 3;
                    input.text_changed.connect(godot_1.Callable.create((text) => {
                        this._onTextFieldChanged(i, text);
                    }));
                    row.add_child(input);
                }
            }
        }
        _onTextFieldChanged(index, text) {
            let field = this._getCurrentFields()[index];
            if (field == null)
                return;
            if (field.type == "number") {
                let n = Number(text);
                if (!Number.isFinite(n)) {
                    this._setStatus("Invalid number: " + field.name);
                    return;
                }
                field.value = n;
            }
            else {
                field.value = text;
            }
            this._markDirty();
        }
        _markDirty() {
            this._dirty = true;
            this._setStatus("Changed, export to write json");
        }
        _clearFieldsUI() {
            while (this._fieldsBox.get_child_count() > 0) {
                let child = this._fieldsBox.get_child(0);
                this._fieldsBox.remove_child(child);
                child.queue_free();
            }
        }
        _setStatus(text) {
            this._statusLabel.text = (this._dirty ? "Unsaved | " : "") + text;
        }
        _getDroppedTsFiles(data) {
            let d = data;
            if (d != null && typeof d.proxy === "function") {
                d = d.proxy();
            }
            let filesRaw = null;
            if (d != null) {
                if (d["files"] !== undefined) {
                    filesRaw = d["files"];
                }
                else if (typeof d.get === "function") {
                    filesRaw = d.get("files");
                }
            }
            let files = filesRaw != null ? this._normaliseStringArray(filesRaw) : [];
            if (files.length == 0)
                files = this._normaliseStringArray(d != null ? d : data);
            return files.filter(path => path.toLowerCase().endsWith(".ts"));
        }
        _normaliseStringArray(value) {
            if (value == null)
                return [];
            if (Array.isArray(value))
                return value.map(x => String(x));
            if (typeof value.size === "function" && typeof value.get_indexed === "function") {
                let result = [];
                let count = value.size();
                for (let i = 0; i < count; i++) {
                    let item = value.get_indexed(i);
                    if (item != null)
                        result.push(String(item));
                }
                return result;
            }
            if (typeof value.proxy === "function") {
                let proxy = value.proxy();
                if (Array.isArray(proxy))
                    return proxy.map(x => String(x));
            }
            if (typeof value == "string")
                return [value];
            return [];
        }
        _syncClassSelect() {
            this._classSelect.clear();
            this._classSelect.disabled = this._classes.length == 0;
            for (let i = 0; i < this._classes.length; i++) {
                let configClass = this._classes[i];
                this._classSelect.add_item(configClass.configName + " (" + configClass.className + ")", i);
            }
        }
        _selectClass(index) {
            if (index < 0 || index >= this._classes.length)
                return;
            this._selectedClassIndex = index;
            this._classSelect.select(index);
            this._applyExportedValues(this._classes[index]);
            this._pathLabel.text = this._classes[index].filePath;
            this._exportBtn.disabled = false;
            this._rebuildFieldsUI();
        }
        _getCurrentClass() {
            if (this._selectedClassIndex < 0 || this._selectedClassIndex >= this._classes.length)
                return null;
            return this._classes[this._selectedClassIndex];
        }
        _getCurrentFields() {
            let configClass = this._getCurrentClass();
            return configClass != null ? configClass.fields : [];
        }
        _buildExportObject(configClass) {
            let data = {};
            for (let field of configClass.fields) {
                data[field.name] = field.value;
            }
            return data;
        }
        _parseEasyConfigArgs(args, className) {
            let configName = className;
            let exportPath = "";
            let text = args.trim();
            if (text.length > 0) {
                let stringMatch = /^(?:"([^"]+)"|'([^']+)')$/.exec(text);
                if (stringMatch != null) {
                    configName = stringMatch[1] ?? stringMatch[2] ?? className;
                }
                else {
                    let nameMatch = /name\s*:\s*(?:"([^"]+)"|'([^']+)')/.exec(text);
                    let exportPathMatch = /exportPath\s*:\s*(?:"([^"]+)"|'([^']+)')/.exec(text);
                    if (nameMatch != null)
                        configName = nameMatch[1] ?? nameMatch[2] ?? className;
                    if (exportPathMatch != null)
                        exportPath = exportPathMatch[1] ?? exportPathMatch[2] ?? "";
                }
            }
            if (exportPath == "")
                exportPath = "res://gen/easy_config/" + configName + ".json";
            return { configName, exportPath };
        }
        _findMatchingBrace(source, openBraceIndex) {
            let depth = 0;
            let quote = "";
            let escaped = false;
            for (let i = openBraceIndex; i < source.length; i++) {
                let ch = source.charAt(i);
                if (quote != "") {
                    if (escaped) {
                        escaped = false;
                    }
                    else if (ch == "\\") {
                        escaped = true;
                    }
                    else if (ch == quote) {
                        quote = "";
                    }
                    continue;
                }
                if (ch == "\"" || ch == "'" || ch == "`") {
                    quote = ch;
                }
                else if (ch == "{") {
                    depth++;
                }
                else if (ch == "}") {
                    depth--;
                    if (depth == 0)
                        return i;
                }
            }
            return -1;
        }
        _getParentDir(path) {
            let index = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
            return index >= 0 ? path.substring(0, index) : "";
        }
    };
    return EasyConfigEditor = _classThis;
})();
exports.default = EasyConfigEditor;
//# sourceMappingURL=easy_config_editor.js.map