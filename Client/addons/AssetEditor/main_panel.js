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
const asset_db_1 = require("./asset_db");
const godot_annotations_1 = require("godot.annotations");
const ICON_PACKAGE = "res://addons/AssetEditor/icons/package.svg";
const ICON_GROUP = "res://addons/AssetEditor/icons/group.svg";
const ICON_RESOURCE = "res://addons/AssetEditor/icons/resource.svg";
const META_TYPE = "type";
const META_PKG_NAME = "pname";
const META_GROUP_NAME = "gname";
const MOUSE_BUTTON_RIGHT = 2;
var ItemKind;
(function (ItemKind) {
    ItemKind["PACKAGE"] = "pkg";
    ItemKind["GROUP"] = "grp";
})(ItemKind || (ItemKind = {}));
var bind = (0, godot_annotations_1.createClassBinder)();
let main_panel = (() => {
    let _classDecorators = [bind(), bind.tool()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = godot_1.VBoxContainer;
    var main_panel = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            main_panel = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        db = { version: Date.now(), versionCode: 0, packages: {} };
        dirty = false;
        _tree;
        _addPkgBtn;
        _renameBtn;
        _deleteBtn;
        _saveBtn;
        _exportBtn;
        _exportPckBtn;
        _reloadBtn;
        _versionEdit;
        _versionCodeEdit;
        _statusLabel;
        _settingsBox;
        _assetScroll;
        _assetVBox;
        _selectedPkgName = "";
        _selectedGroupName = "";
        _iconPkg;
        _iconGrp;
        _iconRes;
        _popup;
        _inputDlg;
        _inputEdit;
        _inputCb = null;
        _itemMeta = new Map();
        _ready() {
            console.log("AssetEditorMain ready");
            this._buildUI();
            this._loadIcons();
            this._wireSignals();
            this._loadData();
        }
        // ---- UI building ----
        _buildUI() {
            let bar = new godot_1.HBoxContainer();
            this.add_child(bar);
            this._addPkgBtn = new godot_1.Button();
            this._addPkgBtn.text = "Add Package";
            bar.add_child(this._addPkgBtn);
            this._renameBtn = new godot_1.Button();
            this._renameBtn.text = "Rename";
            this._renameBtn.disabled = true;
            bar.add_child(this._renameBtn);
            this._deleteBtn = new godot_1.Button();
            this._deleteBtn.text = "Delete";
            this._deleteBtn.disabled = true;
            bar.add_child(this._deleteBtn);
            let sp = new godot_1.Control();
            sp.size_flags_horizontal = 3;
            bar.add_child(sp);
            this._saveBtn = new godot_1.Button();
            this._saveBtn.text = "Save";
            bar.add_child(this._saveBtn);
            this._exportBtn = new godot_1.Button();
            this._exportBtn.text = "Export Catalogs";
            bar.add_child(this._exportBtn);
            this._exportPckBtn = new godot_1.Button();
            this._exportPckBtn.text = "Export PCK";
            bar.add_child(this._exportPckBtn);
            this._reloadBtn = new godot_1.Button();
            this._reloadBtn.text = "Reload";
            bar.add_child(this._reloadBtn);
            let versionBar = new godot_1.HBoxContainer();
            this.add_child(versionBar);
            let versionLabel = new godot_1.Label();
            versionLabel.text = "Version";
            versionBar.add_child(versionLabel);
            this._versionEdit = new godot_1.LineEdit();
            this._versionEdit.custom_minimum_size = new godot_1.Vector2(160, 0);
            versionBar.add_child(this._versionEdit);
            let versionCodeLabel = new godot_1.Label();
            versionCodeLabel.text = "VersionCode";
            versionBar.add_child(versionCodeLabel);
            this._versionCodeEdit = new godot_1.LineEdit();
            this._versionCodeEdit.custom_minimum_size = new godot_1.Vector2(90, 0);
            versionBar.add_child(this._versionCodeEdit);
            let split = new godot_1.HSplitContainer();
            split.size_flags_vertical = 3;
            this.add_child(split);
            let left = new godot_1.VBoxContainer();
            left.size_flags_horizontal = 3;
            left.custom_minimum_size = new godot_1.Vector2(200, 0);
            split.add_child(left);
            let lLbl = new godot_1.Label();
            lLbl.text = "Packages & Groups";
            left.add_child(lLbl);
            this._tree = new godot_1.Tree();
            this._tree.size_flags_vertical = 3;
            this._tree.size_flags_horizontal = 3;
            this._tree.columns = 1;
            this._tree.hide_root = true;
            this._tree.select_mode = godot_1.Tree.SelectMode.SELECT_ROW;
            left.add_child(this._tree);
            let right = new godot_1.VBoxContainer();
            right.size_flags_horizontal = 3;
            right.custom_minimum_size = new godot_1.Vector2(300, 0);
            split.add_child(right);
            let rLbl = new godot_1.Label();
            rLbl.text = "Assets";
            right.add_child(rLbl);
            this._settingsBox = new godot_1.VBoxContainer();
            right.add_child(this._settingsBox);
            this._assetScroll = new godot_1.ScrollContainer();
            this._assetScroll.size_flags_vertical = 3;
            right.add_child(this._assetScroll);
            this._assetVBox = new godot_1.VBoxContainer();
            this._assetVBox.size_flags_horizontal = 3;
            this._assetScroll.add_child(this._assetVBox);
            this._statusLabel = new godot_1.Label();
            this._statusLabel.text = "Ready";
            this.add_child(this._statusLabel);
            this._popup = new godot_1.PopupMenu();
            this.add_child(this._popup);
            this._inputDlg = new godot_1.AcceptDialog();
            this._inputDlg.title = "Input";
            this.add_child(this._inputDlg);
            let ivb = new godot_1.VBoxContainer();
            this._inputDlg.add_child(ivb);
            this._inputEdit = new godot_1.LineEdit();
            ivb.add_child(this._inputEdit);
        }
        _loadIcons() {
            this._iconPkg = godot_1.ResourceLoader.load(ICON_PACKAGE);
            this._iconGrp = godot_1.ResourceLoader.load(ICON_GROUP);
            this._iconRes = godot_1.ResourceLoader.load(ICON_RESOURCE);
        }
        _wireSignals() {
            // Use direct method references with GodotJS runtime which accepts plain functions
            this._addPkgBtn.pressed.connect(godot_1.Callable.create(this, "_onAddPackage"));
            this._renameBtn.pressed.connect(godot_1.Callable.create(this, "_onRename"));
            this._deleteBtn.pressed.connect(godot_1.Callable.create(this, "_onDelete"));
            this._saveBtn.pressed.connect(godot_1.Callable.create(this, "_onSave"));
            this._exportBtn.pressed.connect(godot_1.Callable.create(this, "_onExportCatalogs"));
            this._exportPckBtn.pressed.connect(godot_1.Callable.create(this, "_onExportPcks"));
            this._reloadBtn.pressed.connect(godot_1.Callable.create(this, "_onReload"));
            this._versionEdit.text_submitted.connect(godot_1.Callable.create(this, "_onVersionSubmitted"));
            this._versionCodeEdit.text_submitted.connect(godot_1.Callable.create(this, "_onVersionCodeSubmitted"));
            this._tree.item_selected.connect(godot_1.Callable.create(this, "_onTreeSel"));
            this._tree.nothing_selected.connect(godot_1.Callable.create(this, "_onTreeNone"));
            this._tree.empty_clicked.connect(godot_1.Callable.create(this, "_onEmptyClicked"));
            this._tree.gui_input.connect(godot_1.Callable.create(this, "_onTreeGuiInput"));
            // Drag & drop forwarding with Callable references (required by GodotJS)
            this._tree.set_drag_forwarding(godot_1.Callable.create(this, "_drag_begin"), godot_1.Callable.create(this, "_drag_can"), godot_1.Callable.create(this, "_drag_drop"));
            this._popup.id_pressed.connect(godot_1.Callable.create(this, "_onPopupId"));
            this._inputDlg.confirmed.connect(godot_1.Callable.create(this, "_onInputConfirmed"));
        }
        // ---- signal handlers (separate methods for use with GodotJS signal system) ----
        _onEmptyClicked(_pos, _btn) {
            if (_btn === MOUSE_BUTTON_RIGHT) {
                if (this._popup.visible)
                    return;
                this._popup.clear();
                this._popup.add_item("Add Package", 101);
                this._popup.popup();
                let vp = this.get_viewport();
                if (vp) {
                    let mpos = vp.get_mouse_position();
                    this._popup.position = new godot_1.Vector2i(mpos.x, mpos.y);
                }
            }
            else {
                this._onTreeNone();
            }
        }
        _onTreeGuiInput(event) {
            const mbEvent = event;
            if (mbEvent.button_index == null)
                return;
            if (mbEvent.button_index !== MOUSE_BUTTON_RIGHT)
                return;
            if (!mbEvent.pressed)
                return; // Use get_local_mouse_position() for tree-local coordinates		
            const localPos = this._tree.get_local_mouse_position();
            const ti = this._tree.get_item_at_position(localPos);
            if (ti != null) {
                ti.select(0);
                this._onTreeRMB();
            }
        }
        _onPopupId(id) {
            this._onPopup(id);
        }
        _onInputConfirmed() {
            if (this._inputCb) {
                this._inputCb(this._inputEdit.text);
                this._inputCb = null;
            }
        }
        _getMeta(ti) {
            return this._itemMeta.get(ti) ?? null;
        }
        _mousePos() {
            return this.get_global_mouse_position();
        }
        // ---- data ----
        _loadData() {
            this.db = (0, asset_db_1.loadDatabase)();
            this.db.version = Date.now();
            this._syncVersionFields();
            this._rebuild();
            this.dirty = false;
            this._syncStatus();
        }
        _syncVersionFields() {
            this._versionEdit.text = String(this.db.version);
            this._versionCodeEdit.text = String(this.db.versionCode);
        }
        _commitVersionFields() {
            const version = Number(this._versionEdit.text);
            const versionCode = Number(this._versionCodeEdit.text);
            if (!Number.isFinite(version) || !Number.isFinite(versionCode)) {
                this._syncVersionFields();
                this._statusLabel.text = "Invalid version fields";
                return false;
            }
            if (this.db.version !== Math.floor(version) || this.db.versionCode !== Math.floor(versionCode)) {
                this.db.version = Math.floor(version);
                this.db.versionCode = Math.floor(versionCode);
                this.dirty = true;
            }
            this._syncVersionFields();
            return true;
        }
        _onVersionSubmitted(_text) {
            this._commitVersionFields();
            this._syncStatus();
        }
        _onVersionCodeSubmitted(_text) {
            this._commitVersionFields();
            this._syncStatus();
        }
        _onSave() {
            if (!this._commitVersionFields())
                return;
            if ((0, asset_db_1.saveDatabase)(this.db)) {
                this.dirty = false;
                this._statusLabel.text = "Saved!";
            }
            else {
                this._statusLabel.text = "Save failed!";
            }
        }
        _onExportCatalogs() {
            if (!this._commitVersionFields())
                return;
            const catalogs = (0, asset_db_1.exportCatalogs)(this.db);
            const json = JSON.stringify(catalogs, null, "\t");
            const outPath = "res://gen/catalogs.json";
            const file = godot_1.FileAccess.open(outPath, godot_1.FileAccess.ModeFlags.WRITE);
            if (file) {
                file.store_string(json);
                file.close();
                this._statusLabel.text = "Catalogs exported to " + outPath;
            }
            else {
                this._statusLabel.text = "Export failed: cannot write " + outPath;
            }
        }
        _onExportPcks() {
            if (!this._commitVersionFields())
                return;
            const result = (0, asset_db_1.exportCatalogsWithPcks)(this.db);
            const json = JSON.stringify(result.catalogs, null, "\t");
            const outPath = "res://gen/catalogs.json";
            const file = godot_1.FileAccess.open(outPath, godot_1.FileAccess.ModeFlags.WRITE);
            if (file) {
                file.store_string(json);
                file.close();
            }
            else {
                this._statusLabel.text = "Export failed: cannot write " + outPath;
                return;
            }
            let status = "PCK exported: " + result.exported.length + ", catalogs: " + outPath;
            if (result.errors.length > 0) {
                status += ", errors: " + result.errors.length;
                console.error(result.errors.join("\n"));
            }
            if (result.warnings.length > 0) {
                status += ", warnings: " + result.warnings.length;
                console.warn(result.warnings.join("\n"));
            }
            this._statusLabel.text = status;
        }
        _onReload() {
            this._loadData();
            this._clearAssets();
            this._selectedPkgName = "";
            this._selectedGroupName = "";
            this._statusLabel.text = "Reloaded";
        }
        // ---- tree ----
        _rebuild() {
            this._itemMeta.clear();
            this._tree.clear();
            let root = this._tree.create_item();
            for (let pkgName of Object.keys(this.db.packages)) {
                let pkg = this.db.packages[pkgName];
                let ti = this._makePkgItem(root, pkgName, pkg);
                ti.collapsed = false;
            }
        }
        _makePkgItem(parent, pkgName, pkg) {
            let ti = this._tree.create_item(parent);
            ti.set_text(0, pkgName);
            ti.set_icon(0, this._iconPkg);
            this._itemMeta.set(ti, { [META_TYPE]: ItemKind.PACKAGE, [META_PKG_NAME]: pkgName });
            ti.set_tooltip_text(0, "Package: " + pkgName);
            for (let [grpName, grp] of Object.entries(pkg.groups)) {
                this._makeGrpItem(ti, pkgName, grpName, grp);
            }
            return ti;
        }
        _makeGrpItem(parent, pkgName, grpName, grp) {
            let ti = this._tree.create_item(parent);
            ti.set_text(0, grpName);
            ti.set_icon(0, this._iconGrp);
            this._itemMeta.set(ti, { [META_TYPE]: ItemKind.GROUP, [META_PKG_NAME]: pkgName, [META_GROUP_NAME]: grpName });
            ti.set_tooltip_text(0, "Group: " + grpName + " (" + Object.keys(grp.items).length + " items)");
            return ti;
        }
        // ---- selection ----
        _onTreeSel() {
            let ti = this._tree.get_selected();
            if (ti == null) {
                this._clearSel();
                return;
            }
            let m = this._getMeta(ti);
            if (m == null) {
                this._clearSel();
                return;
            }
            if (m[META_TYPE] == ItemKind.PACKAGE) {
                this._selectedPkgName = m[META_PKG_NAME];
                this._selectedGroupName = "";
                this._renameBtn.disabled = false;
                this._deleteBtn.disabled = false;
                this._syncSettings();
                this._clearAssets();
                this._hint("Select a group to view assets.");
            }
            else if (m[META_TYPE] == ItemKind.GROUP) {
                this._selectedPkgName = m[META_PKG_NAME];
                this._selectedGroupName = m[META_GROUP_NAME];
                this._renameBtn.disabled = false;
                this._deleteBtn.disabled = false;
                this._syncSettings();
                this._syncAssets();
            }
            this._syncStatus();
        }
        _onTreeRMB() {
            // Don't re-open the popup if it's already visible
            if (this._popup.visible)
                return;
            let ti = this._tree.get_selected();
            if (ti == null)
                return;
            let m = this._getMeta(ti);
            if (m == null)
                return;
            this._popup.clear();
            if (m[META_TYPE] == ItemKind.PACKAGE) {
                this._popup.add_item("Add Group", 101);
                this._popup.add_separator();
                this._popup.add_item("Rename Package", 102);
                this._popup.add_item("Delete Package", 103);
            }
            else {
                this._popup.add_item("Rename Group", 201);
                this._popup.add_item("Delete Group", 202);
                this._popup.add_separator();
                this._popup.add_item("Clear Assets", 203);
            }
            let mouse = this.get_global_mouse_position();
            this._popup.popup();
            this._popup.position = new godot_1.Vector2i(mouse.x, mouse.y);
        }
        _onTreeNone() { this._clearSel(); }
        _clearSel() {
            this._selectedPkgName = "";
            this._selectedGroupName = "";
            this._renameBtn.disabled = true;
            this._deleteBtn.disabled = true;
            this._clearSettings();
            this._clearAssets();
            this._syncStatus();
        }
        // ---- toolbar ----
        _onAddPackage() {
            console.log("===============_onAddPackage============");
            this._showInput("Package Name", "NewPackage", (s) => {
                if (s.trim() == "")
                    return;
                (0, asset_db_1.addPackage)(this.db, s.trim());
                this._rebuild();
                this.dirty = true;
                this._statusLabel.text = "Added package: " + s;
            });
        }
        _onRename() {
            console.log("===============_onRename============");
            if (this._selectedGroupName) {
                let p = this.db.packages[this._selectedPkgName];
                if (p == null)
                    return;
                let g = p.groups[this._selectedGroupName];
                if (g == null)
                    return;
                this._showInput("Group Name", this._selectedGroupName, (s) => {
                    if (s.trim() == "")
                        return;
                    (0, asset_db_1.renameGroup)(this.db, this._selectedPkgName, this._selectedGroupName, s.trim());
                    this._rebuild();
                    this.dirty = true;
                });
            }
            else if (this._selectedPkgName) {
                let p = this.db.packages[this._selectedPkgName];
                if (p == null)
                    return;
                this._showInput("Package Name", this._selectedPkgName, (s) => {
                    if (s.trim() == "")
                        return;
                    (0, asset_db_1.renamePackage)(this.db, this._selectedPkgName, s.trim());
                    this._rebuild();
                    this.dirty = true;
                });
            }
        }
        _onDelete() {
            console.log("===============_onDelete============");
            if (this._selectedGroupName) {
                (0, asset_db_1.removeGroup)(this.db, this._selectedPkgName, this._selectedGroupName);
                this._selectedGroupName = "";
                this._rebuild();
                this.dirty = true;
                this._clearAssets();
                this._statusLabel.text = "Deleted group";
            }
            else if (this._selectedPkgName) {
                (0, asset_db_1.removePackage)(this.db, this._selectedPkgName);
                this._selectedPkgName = "";
                this._selectedGroupName = "";
                this._rebuild();
                this.dirty = true;
                this._clearAssets();
                this._statusLabel.text = "Deleted package";
            }
        }
        // ---- popup ----
        _onPopup(id) {
            console.log("===============_onPopup============");
            let pname = this._selectedPkgName, gname = this._selectedGroupName;
            switch (id) {
                case 101:
                    this._showInput("Group Name", "NewGroup", (s) => {
                        if (s.trim() == "" || pname == "")
                            return;
                        (0, asset_db_1.addGroup)(this.db, pname, s.trim());
                        this._rebuild();
                        this.dirty = true;
                    });
                    break;
                case 102:
                    this._onRename();
                    break;
                case 103:
                    this._onDelete();
                    break;
                case 201:
                    this._onRename();
                    break;
                case 202:
                    this._onDelete();
                    break;
                case 203:
                    (0, asset_db_1.clearGroupItems)(this.db, pname, gname);
                    this._rebuild();
                    this._syncAssets();
                    this.dirty = true;
                    this._statusLabel.text = "Cleared assets";
                    break;
            }
        }
        // ---- input dialog ----
        _showInput(title, def, cb) {
            console.log("===============_showInput============");
            this._inputDlg.title = title;
            this._inputEdit.text = def;
            this._inputEdit.select_all();
            this._inputCb = cb;
            // Position dialog near mouse rather than screen center
            let mpos = this._mousePos();
            let dlgSize = new godot_1.Vector2i(300, 100);
            this._inputDlg.popup();
            this._inputDlg.size = dlgSize;
            let pos = new godot_1.Vector2i(Math.max(0, Math.round(mpos.x - dlgSize.x / 2)), Math.max(0, Math.round(mpos.y - dlgSize.y / 2)));
            this._inputDlg.position = pos;
            this._inputEdit.grab_focus();
        }
        // ---- asset view ----
        _clearAssets() {
            while (this._assetVBox.get_child_count() > 0) {
                let c = this._assetVBox.get_child(0);
                this._assetVBox.remove_child(c);
                c.queue_free();
            }
        }
        _hint(t) {
            let lb = new godot_1.Label();
            lb.text = t;
            this._assetVBox.add_child(lb);
        }
        _clearSettings() {
            while (this._settingsBox.get_child_count() > 0) {
                let c = this._settingsBox.get_child(0);
                this._settingsBox.remove_child(c);
                c.queue_free();
            }
        }
        _syncSettings() {
            this._clearSettings();
            if (!this._selectedPkgName)
                return;
            let pkg = this.db.packages[this._selectedPkgName];
            if (pkg == null)
                return;
            let title = new godot_1.Label();
            title.text = this._selectedGroupName ? "Group Settings" : "Package Settings";
            this._settingsBox.add_child(title);
            let encrypt = new godot_1.CheckBox();
            encrypt.text = "Encrypt";
            if (this._selectedGroupName) {
                let group = pkg.groups[this._selectedGroupName];
                if (group == null)
                    return;
                encrypt.set_pressed_no_signal(group.isEncrypt);
                encrypt.pressed.connect(godot_1.Callable.create(() => {
                    group.isEncrypt = encrypt.button_pressed;
                    this._rebuild();
                    this._syncSettings();
                    this.dirty = true;
                }));
            }
            else {
                encrypt.set_pressed_no_signal(pkg.isEncrypt);
                encrypt.pressed.connect(godot_1.Callable.create(() => {
                    pkg.isEncrypt = encrypt.button_pressed;
                    this._rebuild();
                    this._syncSettings();
                    this.dirty = true;
                }));
            }
            this._settingsBox.add_child(encrypt);
            if (!this._selectedGroupName) {
                let row = new godot_1.HBoxContainer();
                this._settingsBox.add_child(row);
                let lb = new godot_1.Label();
                lb.text = "Download Priority";
                row.add_child(lb);
                let priority = new godot_1.OptionButton();
                priority.add_item("Must", 0);
                priority.add_item("High", 1);
                priority.add_item("Low", 2);
                priority.select(Math.max(0, Math.min(2, pkg.downloadPriority)));
                priority.item_selected.connect(godot_1.Callable.create((index) => {
                    pkg.downloadPriority = priority.get_item_id(index);
                    this._rebuild();
                    this._syncSettings();
                    this.dirty = true;
                }));
                row.add_child(priority);
            }
            else {
                let note = new godot_1.Label();
                note.text = pkg.isEncrypt ? "Effective Encrypt: true (package)" : "Effective Encrypt: group value";
                this._settingsBox.add_child(note);
            }
            this._settingsBox.add_child(new godot_1.HSeparator());
        }
        _syncAssets() {
            this._clearAssets();
            if (!this._selectedPkgName || !this._selectedGroupName) {
                this._hint("Select a group.");
                return;
            }
            let p = this.db.packages[this._selectedPkgName];
            if (p == null)
                return;
            let g = p.groups[this._selectedGroupName];
            if (g == null)
                return;
            let hd = new godot_1.Label();
            hd.text = this._selectedPkgName + " / " + this._selectedGroupName;
            this._assetVBox.add_child(hd);
            let ct = new godot_1.Label();
            ct.text = Object.keys(g.items).length + " entries";
            this._assetVBox.add_child(ct);
            this._assetVBox.add_child(new godot_1.HSeparator());
            let pname = this._selectedPkgName, gname = this._selectedGroupName;
            for (let [path, item] of Object.entries(g.items)) {
                let entry = new godot_1.VBoxContainer();
                entry.size_flags_horizontal = 3;
                this._assetVBox.add_child(entry);
                // Row 1: Asset info + remove button
                let row = new godot_1.HBoxContainer();
                row.size_flags_horizontal = 3;
                entry.add_child(row);
                let tr = new godot_1.TextureRect();
                tr.texture = this._iconRes;
                tr.stretch_mode = godot_1.TextureRect.StretchMode.STRETCH_KEEP;
                tr.custom_minimum_size = new godot_1.Vector2(20, 20);
                row.add_child(tr);
                let tl = new godot_1.Label();
                tl.text = "[" + item.type + "]";
                tl.custom_minimum_size = new godot_1.Vector2(50, 0);
                row.add_child(tl);
                let pl = new godot_1.Label();
                pl.text = path;
                pl.size_flags_horizontal = 3;
                row.add_child(pl);
                let rPath = path;
                let rm = new godot_1.Button();
                rm.text = "X";
                rm.custom_minimum_size = new godot_1.Vector2(30, 0);
                row.add_child(rm);
                // Use a callback wrapper to handle the remove button click
                let removeId = this._addRemoveCallback(pname, gname, rPath);
                rm.pressed.connect(godot_1.Callable.create(this._makeRemoveHandler(removeId)));
                // Row 2: Keys
                let keysRow = new godot_1.HBoxContainer();
                keysRow.size_flags_horizontal = 3;
                entry.add_child(keysRow);
                // Indentation spacer — keys below asset info, separate from delete button row
                let indent = new godot_1.Control();
                indent.custom_minimum_size = new godot_1.Vector2(24, 0);
                keysRow.add_child(indent);
                let keysLabel = new godot_1.Label();
                keysLabel.text = "Keys:";
                keysLabel.custom_minimum_size = new godot_1.Vector2(36, 0);
                keysRow.add_child(keysLabel);
                if (item.keys && item.keys.length > 0) {
                    for (let key of item.keys) {
                        let keyTag = new godot_1.HBoxContainer();
                        let kl = new godot_1.Label();
                        kl.text = key;
                        keyTag.add_child(kl);
                        let rk = new godot_1.Button();
                        rk.text = "×";
                        rk.custom_minimum_size = new godot_1.Vector2(20, 0);
                        keyTag.add_child(rk);
                        keysRow.add_child(keyTag);
                        let rkId = this._addRemoveKeyCallback(pname, gname, rPath, key);
                        rk.pressed.connect(godot_1.Callable.create(this._makeRemoveKeyHandler(rkId)));
                    }
                }
                let addKeyBtn = new godot_1.Button();
                addKeyBtn.text = "+";
                addKeyBtn.custom_minimum_size = new godot_1.Vector2(24, 0);
                addKeyBtn.tooltip_text = "Add key";
                keysRow.add_child(addKeyBtn);
                addKeyBtn.pressed.connect(godot_1.Callable.create(() => {
                    this._showInput("Add Key", "", (s) => {
                        if (s.trim() == "")
                            return;
                        (0, asset_db_1.addKeyToAsset)(this.db, pname, gname, rPath, s.trim());
                        this._syncAssets();
                        this._rebuild();
                        this.dirty = true;
                    });
                }));
            }
            // Build expanded list inline to avoid cross-module GArray issues
            let expanded = [];
            for (let [path, item] of Object.entries(g.items)) {
                if (item.type == "folder") {
                    this._collectFolderFiles(path, expanded);
                }
                else {
                    expanded.push(path);
                }
            }
            if (expanded.length > 0) {
                this._assetVBox.add_child(new godot_1.HSeparator());
                let el = new godot_1.Label();
                el.text = "Expanded (" + expanded.length + " files):";
                this._assetVBox.add_child(el);
                for (let fp of expanded) {
                    let row = new godot_1.HBoxContainer();
                    row.size_flags_horizontal = 3;
                    this._assetVBox.add_child(row);
                    let tr = new godot_1.TextureRect();
                    tr.texture = this._iconRes;
                    tr.stretch_mode = godot_1.TextureRect.StretchMode.STRETCH_KEEP;
                    tr.custom_minimum_size = new godot_1.Vector2(16, 16);
                    row.add_child(tr);
                    let pl = new godot_1.Label();
                    pl.text = fp;
                    pl.size_flags_horizontal = 3;
                    row.add_child(pl);
                }
            }
        }
        // Store pending remove callbacks
        _removeCallbacks = new Map();
        _removeNextId = 1;
        _addRemoveCallback(pname, gname, path) {
            if (!this._removeCallbacks)
                this._removeCallbacks = new Map();
            if (!this._removeNextId)
                this._removeNextId = 1;
            let id = this._removeNextId++;
            this._removeCallbacks.set(id, () => {
                (0, asset_db_1.removeAssetFromGroup)(this.db, pname, gname, path);
                this._syncAssets();
                this._rebuild();
                this.dirty = true;
            });
            return id;
        }
        _onRemoveClicked(id) {
            if (!this._removeCallbacks)
                return;
            let cb = this._removeCallbacks.get(id);
            if (cb) {
                cb();
                this._removeCallbacks.delete(id);
            }
        }
        _makeRemoveHandler(id) {
            return () => this._onRemoveClicked(id);
        }
        // ---- key management ----
        _removeKeyCallbacks = new Map();
        _removeKeyNextId = 1;
        _addRemoveKeyCallback(pname, gname, path, key) {
            if (!this._removeKeyCallbacks)
                this._removeKeyCallbacks = new Map();
            if (!this._removeKeyNextId)
                this._removeKeyNextId = 1;
            let id = this._removeKeyNextId++;
            this._removeKeyCallbacks.set(id, () => {
                (0, asset_db_1.removeKeyFromAsset)(this.db, pname, gname, path, key);
                this._syncAssets();
                this._rebuild();
                this.dirty = true;
            });
            return id;
        }
        _onRemoveKeyClicked(id) {
            if (!this._removeKeyCallbacks)
                return;
            let cb = this._removeKeyCallbacks.get(id);
            if (cb) {
                cb();
                this._removeKeyCallbacks.delete(id);
            }
        }
        _makeRemoveKeyHandler(id) {
            return () => this._onRemoveKeyClicked(id);
        }
        // ---- folder scanning ----
        _collectFolderFiles(folderPath, output) {
            let dir = godot_1.DirAccess.open(folderPath);
            if (dir == null)
                return;
            dir.list_dir_begin();
            let entry = dir.get_next();
            while (entry != "") {
                if (entry != "." && entry != "..") {
                    let fp = folderPath.endsWith("/") ? folderPath + entry : folderPath + "/" + entry;
                    if (dir.current_is_dir()) {
                        this._collectFolderFiles(fp, output);
                    }
                    else {
                        output.push(fp);
                    }
                }
                entry = dir.get_next();
            }
            dir.list_dir_end();
        }
        // ---- drag & drop ----
        /** Called when a drag starts over the Tree — we don't start drags ourselves */
        _drag_begin(_pos) {
            return null;
        }
        /** Called repeatedly during drag to check if drop is allowed over a Group */
        _drag_can(_pos, data) {
            if (data == null || typeof data != 'object')
                return false;
            const ti = this._tree.get_item_at_position(_pos);
            if (ti == null)
                return false;
            const m = this._getMeta(ti);
            if (m == null || m[META_TYPE] != ItemKind.GROUP)
                return false;
            return true;
        }
        /** Called when the user drops data — add file/folder to the target Group */
        _drag_drop(_pos, data) {
            const ti = this._tree.get_item_at_position(_pos);
            if (ti == null)
                return;
            const m = this._getMeta(ti);
            if (m == null || m[META_TYPE] != ItemKind.GROUP)
                return;
            const pname = m[META_PKG_NAME], gname = m[META_GROUP_NAME];
            this._handleDropData(pname, gname, data);
        }
        _get_drag_data(_at_position) {
            return null; // We only handle drops, not drags
        }
        _getDropTargetGroupMeta(pos) {
            let ti = null;
            if (pos != null) {
                // 1 — Try pos directly (coordinate system depends on propagation)
                ti = this._tree.get_item_at_position(pos);
                // 2 — Panel-local → tree-local via get_global_rect()
                if (ti == null) {
                    const panelRect = this.get_global_rect();
                    const treeRect = this._tree.get_global_rect();
                    const treeLocal = new godot_1.Vector2(pos.x + panelRect.position.x - treeRect.position.x, pos.y + panelRect.position.y - treeRect.position.y);
                    ti = this._tree.get_item_at_position(treeLocal);
                }
                // 3 — Fallback: use selected item
                if (ti == null) {
                    ti = this._tree.get_selected();
                }
            }
            else {
                ti = this._tree.get_selected();
            }
            if (ti == null)
                return null;
            let m = this._getMeta(ti);
            if (m == null || m[META_TYPE] != ItemKind.GROUP)
                return null;
            return m;
        }
        _can_drop_data(at_position, data) {
            if (data == null || typeof data != 'object')
                return false;
            let m = this._getDropTargetGroupMeta(at_position);
            if (m == null)
                return false;
            return true;
        }
        _drop_data(at_position, data) {
            let m = this._getDropTargetGroupMeta(at_position);
            if (m == null)
                return;
            let pname = m[META_PKG_NAME], gname = m[META_GROUP_NAME];
            this._handleDropData(pname, gname, data);
        }
        _handleDropData(pname, gname, data) {
            // --- Extract the list of file/folder paths from drag data ---
            // Godot 4 FileSystem dock provides:  { 'type': 'files', 'files': PackedStringArray }
            // The `data` comes as a GDictionary / Variant.  Try several access patterns.
            let files = [];
            // 1 — Try proxy() unwrap first (GDictionary proxy -> JS object)
            let d;
            if (typeof data.proxy === "function") {
                d = data.proxy();
            }
            else {
                d = data;
            }
            // 2 — Try bracket-notation access on the (possibly unwrapped) data
            let filesRaw = null;
            if (d != null) {
                if (d["files"] !== undefined) {
                    filesRaw = d["files"];
                }
                else if (typeof d.get === "function") {
                    // GDictionary native accessor
                    let v = d.get("files");
                    if (v != null)
                        filesRaw = v;
                }
            }
            // 3 — If filesRaw is found, normalise it into a string[]
            if (filesRaw != null) {
                files = this._normaliseStringArray(filesRaw);
            }
            // 4 — Fallback: data itself might be an array or PackedStringArray
            if (files.length === 0) {
                files = this._normaliseStringArray(d != null ? d : data);
            }
            // 5 — Still nothing? Bail.
            if (files.length === 0) {
                this._statusLabel.text = "No valid files in drag data";
                return;
            }
            let added = 0;
            for (let fp of files) {
                // Detect directory: trailing separator OR actual filesystem directory
                let isDir = fp.endsWith("/") || fp.endsWith("\\") || godot_1.DirAccess.dir_exists_absolute(fp);
                if ((0, asset_db_1.addAssetToGroup)(this.db, pname, gname, fp, isDir ? "folder" : "file"))
                    added++;
            }
            if (added > 0) {
                this._rebuild();
                this._syncAssets();
                this.dirty = true;
                this._statusLabel.text = "Added " + added + " asset(s)";
            }
            else {
                this._statusLabel.text = "No new assets (duplicates skipped)";
            }
        }
        // ---- status ----
        _syncStatus() {
            if (this._selectedPkgName) {
                let p = this.db.packages[this._selectedPkgName];
                if (p) {
                    if (this._selectedGroupName) {
                        let g = p.groups[this._selectedGroupName];
                        if (g) {
                            this._statusLabel.text = this._selectedPkgName + " / " + this._selectedGroupName + " - " + Object.keys(g.items).length + " items";
                            return;
                        }
                    }
                    this._statusLabel.text = this._selectedPkgName + " - " + Object.keys(p.groups).length + " groups";
                    return;
                }
            }
            this._statusLabel.text = (this.dirty ? "Unsaved | " : "") + Object.keys(this.db.packages).length + " packages";
        }
        // ---- public API ----
        addFilesToGroup(files, pkgName, groupName) {
            let c = 0;
            for (let fp of files) {
                let isDir = fp.endsWith("/") || fp.endsWith("\\") || godot_1.DirAccess.dir_exists_absolute(fp);
                if ((0, asset_db_1.addAssetToGroup)(this.db, pkgName, groupName, fp, isDir ? "folder" : "file"))
                    c++;
            }
            if (c > 0) {
                this._rebuild();
                this._syncAssets();
                this.dirty = true;
            }
        }
        // ---- helpers ----
        /** Normalise a GArray / PackedStringArray / plain string[]. */
        _normaliseStringArray(value) {
            if (value == null)
                return [];
            if (Array.isArray(value)) {
                return value.map(x => String(x));
            }
            // GArray with .size() + .get_indexed()
            if (typeof value.size === "function" && typeof value.get_indexed === "function") {
                let sz = value.size();
                let res = [];
                for (let i = 0; i < sz; i++) {
                    let v = value.get_indexed(i);
                    res.push(v != null ? String(v) : "");
                }
                return res;
            }
            // GArray with .proxy()
            if (typeof value.proxy === "function") {
                let p = value.proxy();
                if (Array.isArray(p)) {
                    return p.map(x => String(x));
                }
            }
            // Single string
            if (typeof value === "string") {
                return [value];
            }
            return [];
        }
    };
    return main_panel = _classThis;
})();
exports.default = main_panel;
//# sourceMappingURL=main_panel.js.map