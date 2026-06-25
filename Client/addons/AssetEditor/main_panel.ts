import {
	Control,
	Tree,
	TreeItem,
	Button,
	CheckBox,
	Label,
	OptionButton,
	VBoxContainer,
	HBoxContainer,
	HSplitContainer,
	ScrollContainer,
	TextureRect,
	ResourceLoader,
	Texture2D,
	PopupMenu,
	AcceptDialog,
	LineEdit,
	Vector2,
	Vector2i,
	DirAccess,
	HSeparator,
	Callable,
	InputEvent,
	FileAccess,
} from "godot";

import {
	AssetDBData,
	loadDatabase,
	saveDatabase,
	addPackage,
	removePackage,
	renamePackage,
	addGroup,
	removeGroup,
	renameGroup,
	clearGroupItems,
	addAssetToGroup,
	removeAssetFromGroup,
	addKeyToAsset,
	removeKeyFromAsset,
	exportCatalogs,
	exportCatalogsWithPcks,
} from "./asset_db";

import { createClassBinder } from "godot.annotations";


const ICON_PACKAGE = "res://addons/AssetEditor/icons/package.svg";
const ICON_GROUP = "res://addons/AssetEditor/icons/group.svg";
const ICON_RESOURCE = "res://addons/AssetEditor/icons/resource.svg";

const META_TYPE = "type";
const META_PKG_NAME = "pname";
const META_GROUP_NAME = "gname";
const MOUSE_BUTTON_RIGHT = 2;

enum ItemKind {
	PACKAGE = "pkg",
	GROUP = "grp",
}

var bind = createClassBinder();

@bind()
@bind.tool()
export default class main_panel extends VBoxContainer {
	private db: AssetDBData = { version: Date.now(), versionCode: 0, packages: {} };
	private dirty: boolean = false;

	private _tree!: Tree;
	private _addPkgBtn!: Button;
	private _renameBtn!: Button;
	private _deleteBtn!: Button;
	private _saveBtn!: Button;
	private _exportBtn!: Button;
	private _exportPckBtn!: Button;
	private _reloadBtn!: Button;
	private _versionEdit!: LineEdit;
	private _versionCodeEdit!: LineEdit;
	private _statusLabel!: Label;
	private _settingsBox!: VBoxContainer;
	private _assetScroll!: ScrollContainer;
	private _assetVBox!: VBoxContainer;
	private _selectedPkgName = "";
	private _selectedGroupName = "";

	private _iconPkg!: Texture2D;
	private _iconGrp!: Texture2D;
	private _iconRes!: Texture2D;

	private _popup!: PopupMenu;
	private _inputDlg!: AcceptDialog;
	private _inputEdit!: LineEdit;
	private _inputCb: ((s: string) => void) | null = null;
	private _itemMeta: Map<TreeItem, any> = new Map();

	_ready(): void {
		console.log("AssetEditorMain ready");
		this._buildUI();
		this._loadIcons();
		this._wireSignals();
		this._loadData();
	}

	// ---- UI building ----
	private _buildUI(): void {
		let bar = new HBoxContainer();
		this.add_child(bar);

		this._addPkgBtn = new Button();
		this._addPkgBtn.text = "Add Package";
		bar.add_child(this._addPkgBtn);

		this._renameBtn = new Button();
		this._renameBtn.text = "Rename";
		this._renameBtn.disabled = true;
		bar.add_child(this._renameBtn);

		this._deleteBtn = new Button();
		this._deleteBtn.text = "Delete";
		this._deleteBtn.disabled = true;
		bar.add_child(this._deleteBtn);

		let sp = new Control();
		sp.size_flags_horizontal = 3;
		bar.add_child(sp);

		this._saveBtn = new Button();
		this._saveBtn.text = "Save";
		bar.add_child(this._saveBtn);

		this._exportBtn = new Button();
		this._exportBtn.text = "Export Catalogs";
		bar.add_child(this._exportBtn);

		this._exportPckBtn = new Button();
		this._exportPckBtn.text = "Export PCK";
		bar.add_child(this._exportPckBtn);

		this._reloadBtn = new Button();
		this._reloadBtn.text = "Reload";
		bar.add_child(this._reloadBtn);

		let versionBar = new HBoxContainer();
		this.add_child(versionBar);

		let versionLabel = new Label();
		versionLabel.text = "Version";
		versionBar.add_child(versionLabel);

		this._versionEdit = new LineEdit();
		this._versionEdit.custom_minimum_size = new Vector2(160, 0);
		versionBar.add_child(this._versionEdit);

		let versionCodeLabel = new Label();
		versionCodeLabel.text = "VersionCode";
		versionBar.add_child(versionCodeLabel);

		this._versionCodeEdit = new LineEdit();
		this._versionCodeEdit.custom_minimum_size = new Vector2(90, 0);
		versionBar.add_child(this._versionCodeEdit);

		let split = new HSplitContainer();
		split.size_flags_vertical = 3;
		this.add_child(split);

		let left = new VBoxContainer();
		left.size_flags_horizontal = 3;
		left.custom_minimum_size = new Vector2(200, 0);
		split.add_child(left);

		let lLbl = new Label();
		lLbl.text = "Packages & Groups";
		left.add_child(lLbl);

		this._tree = new Tree();
		this._tree.size_flags_vertical = 3;
		this._tree.size_flags_horizontal = 3;
		this._tree.columns = 1;
		this._tree.hide_root = true;
		this._tree.select_mode = Tree.SelectMode.SELECT_ROW;
		left.add_child(this._tree);

		let right = new VBoxContainer();
		right.size_flags_horizontal = 3;
		right.custom_minimum_size = new Vector2(300, 0);
		split.add_child(right);

		let rLbl = new Label();
		rLbl.text = "Assets";
		right.add_child(rLbl);

		this._settingsBox = new VBoxContainer();
		right.add_child(this._settingsBox);

		this._assetScroll = new ScrollContainer();
		this._assetScroll.size_flags_vertical = 3;
		right.add_child(this._assetScroll);

		this._assetVBox = new VBoxContainer();
		this._assetVBox.size_flags_horizontal = 3;
		this._assetScroll.add_child(this._assetVBox);

		this._statusLabel = new Label();
		this._statusLabel.text = "Ready";
		this.add_child(this._statusLabel);

		this._popup = new PopupMenu();
		this.add_child(this._popup);

		this._inputDlg = new AcceptDialog();
		this._inputDlg.title = "Input";
		this.add_child(this._inputDlg);
		let ivb = new VBoxContainer();
		this._inputDlg.add_child(ivb);
		this._inputEdit = new LineEdit();
		ivb.add_child(this._inputEdit);
	}

	private _loadIcons(): void {
		this._iconPkg = ResourceLoader.load(ICON_PACKAGE) as Texture2D;
		this._iconGrp = ResourceLoader.load(ICON_GROUP) as Texture2D;
		this._iconRes = ResourceLoader.load(ICON_RESOURCE) as Texture2D;
	}

	private _wireSignals(): void {
		// Use direct method references with GodotJS runtime which accepts plain functions
		this._addPkgBtn.pressed.connect(Callable.create(this, "_onAddPackage") as any);
		this._renameBtn.pressed.connect(Callable.create(this, "_onRename") as any);
		this._deleteBtn.pressed.connect(Callable.create(this, "_onDelete") as any);
		this._saveBtn.pressed.connect(Callable.create(this, "_onSave") as any);
		this._exportBtn.pressed.connect(Callable.create(this, "_onExportCatalogs") as any);
		this._exportPckBtn.pressed.connect(Callable.create(this, "_onExportPcks") as any);
		this._reloadBtn.pressed.connect(Callable.create(this, "_onReload") as any);
		this._versionEdit.text_submitted.connect(Callable.create(this, "_onVersionSubmitted") as any);
		this._versionCodeEdit.text_submitted.connect(Callable.create(this, "_onVersionCodeSubmitted") as any);

		this._tree.item_selected.connect(Callable.create(this, "_onTreeSel") as any);
		this._tree.nothing_selected.connect(Callable.create(this, "_onTreeNone") as any);

		this._tree.empty_clicked.connect(Callable.create(this, "_onEmptyClicked") as any);
		this._tree.gui_input.connect(Callable.create(this, "_onTreeGuiInput") as any);

		// Drag & drop forwarding with Callable references (required by GodotJS)
		this._tree.set_drag_forwarding(
			Callable.create(this, "_drag_begin") as any,
			Callable.create(this, "_drag_can") as any,
			Callable.create(this, "_drag_drop") as any,
		);

		this._popup.id_pressed.connect(Callable.create(this, "_onPopupId") as any);
		this._inputDlg.confirmed.connect(Callable.create(this, "_onInputConfirmed") as any);
	}

	// ---- signal handlers (separate methods for use with GodotJS signal system) ----
	private _onEmptyClicked(_pos: Vector2, _btn: number): void {
		if (_btn === MOUSE_BUTTON_RIGHT) {
			if (this._popup.visible)
				return;
			this._popup.clear();
			this._popup.add_item("Add Package", 101);
			this._popup.popup();
			let vp = this.get_viewport();
			if (vp) {
				let mpos = vp.get_mouse_position();
				(this._popup as any).position = new Vector2i(mpos.x, mpos.y);
			}
		} else {
			this._onTreeNone();
		}
	}

	private _onTreeGuiInput(event: InputEvent): void {
		const mbEvent = event as any;
		if (mbEvent.button_index == null)
			return;
		if (mbEvent.button_index !== MOUSE_BUTTON_RIGHT)
			return;
		if (!mbEvent.pressed)
			return;		// Use get_local_mouse_position() for tree-local coordinates		
		const localPos = this._tree.get_local_mouse_position();
		const ti = this._tree.get_item_at_position(localPos);
		if (ti != null) {
			ti.select(0);
			this._onTreeRMB();
		}
	}

	private _onPopupId(id: number): void {
		this._onPopup(id);
	}

	private _onInputConfirmed(): void {
		if (this._inputCb) {
			this._inputCb(this._inputEdit.text);
			this._inputCb = null;
		}
	}

	private _getMeta(ti: TreeItem): any {
		return this._itemMeta.get(ti) ?? null;
	}

	private _mousePos(): Vector2 {
		return this.get_global_mouse_position();
	}
	// ---- data ----
	private _loadData(): void {
		this.db = loadDatabase();
		this.db.version = Date.now();
		this._syncVersionFields();
		this._rebuild();
		this.dirty = false;
		this._syncStatus();
	}
	private _syncVersionFields(): void {
		this._versionEdit.text = String(this.db.version);
		this._versionCodeEdit.text = String(this.db.versionCode);
	}
	private _commitVersionFields(): boolean {
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
	private _onVersionSubmitted(_text: string): void {
		this._commitVersionFields();
		this._syncStatus();
	}
	private _onVersionCodeSubmitted(_text: string): void {
		this._commitVersionFields();
		this._syncStatus();
	}
	private _onSave(): void {
		if (!this._commitVersionFields()) return;
		if (saveDatabase(this.db)) {
			this.dirty = false;
			this._statusLabel.text = "Saved!";
		} else {
			this._statusLabel.text = "Save failed!";
		}
	}

	private _onExportCatalogs(): void {
		if (!this._commitVersionFields()) return;
		const catalogs = exportCatalogs(this.db);
		const json = JSON.stringify(catalogs, null, "\t");
		const outPath = "res://AssetBundles/catalogs.json";
		const file = FileAccess.open(outPath, FileAccess.ModeFlags.WRITE);
		if (file) {
			file.store_string(json);
			file.close();
			this._statusLabel.text = "Catalogs exported to " + outPath;
		} else {
			this._statusLabel.text = "Export failed: cannot write " + outPath;
		}
	}

	private _onExportPcks(): void {
		if (!this._commitVersionFields()) return;
		const result = exportCatalogsWithPcks(this.db);
		const json = JSON.stringify(result.catalogs, null, "\t");
		const outPath = "res://AssetBundles/catalogs.json";
		const file = FileAccess.open(outPath, FileAccess.ModeFlags.WRITE);
		if (file) {
			file.store_string(json);
			file.close();
		} else {
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

	private _onReload(): void {
		this._loadData();
		this._clearAssets();
		this._selectedPkgName = "";
		this._selectedGroupName = "";
		this._statusLabel.text = "Reloaded";
	}

	// ---- tree ----
	private _rebuild(): void {
		this._itemMeta.clear();
		this._tree.clear();
		let root = this._tree.create_item();
		for (let pkgName of Object.keys(this.db.packages)) {
			let pkg = this.db.packages[pkgName];
			let ti = this._makePkgItem(root, pkgName, pkg);
			ti.collapsed = false;
		}
	}
	private _makePkgItem(parent: TreeItem, pkgName: string, pkg: any): TreeItem {
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
	private _makeGrpItem(parent: TreeItem, pkgName: string, grpName: string, grp: any): TreeItem {
		let ti = this._tree.create_item(parent);
		ti.set_text(0, grpName);
		ti.set_icon(0, this._iconGrp);
		this._itemMeta.set(ti, { [META_TYPE]: ItemKind.GROUP, [META_PKG_NAME]: pkgName, [META_GROUP_NAME]: grpName });
		ti.set_tooltip_text(0, "Group: " + grpName + " (" + Object.keys(grp.items).length + " items)");
		return ti;
	}

	// ---- selection ----
	private _onTreeSel(): void {
		let ti = this._tree.get_selected();
		if (ti == null) { this._clearSel(); return; }
		let m = this._getMeta(ti);
		if (m == null) { this._clearSel(); return; }
		if (m[META_TYPE] == ItemKind.PACKAGE) {
			this._selectedPkgName = m[META_PKG_NAME];
			this._selectedGroupName = "";
			this._renameBtn.disabled = false;
			this._deleteBtn.disabled = false;
			this._syncSettings();
			this._clearAssets();
			this._hint("Select a group to view assets.");
		} else if (m[META_TYPE] == ItemKind.GROUP) {
			this._selectedPkgName = m[META_PKG_NAME];
			this._selectedGroupName = m[META_GROUP_NAME];
			this._renameBtn.disabled = false;
			this._deleteBtn.disabled = false;
			this._syncSettings();
			this._syncAssets();
		}
		this._syncStatus();
	}
	private _onTreeRMB(): void {
		// Don't re-open the popup if it's already visible
		if (this._popup.visible) return;
		let ti = this._tree.get_selected();
		if (ti == null) return;
		let m = this._getMeta(ti);
		if (m == null) return;
		this._popup.clear();
		if (m[META_TYPE] == ItemKind.PACKAGE) {
			this._popup.add_item("Add Group", 101);
			this._popup.add_separator();
			this._popup.add_item("Rename Package", 102);
			this._popup.add_item("Delete Package", 103);
		} else {
			this._popup.add_item("Rename Group", 201);
			this._popup.add_item("Delete Group", 202);
			this._popup.add_separator();
			this._popup.add_item("Clear Assets", 203);
		}
		let mouse = this.get_global_mouse_position();
		this._popup.popup();
		(this._popup as any).position = new Vector2i(mouse.x, mouse.y);
	}
	private _onTreeNone(): void { this._clearSel(); }
	private _clearSel(): void {
		this._selectedPkgName = "";
		this._selectedGroupName = "";
		this._renameBtn.disabled = true;
		this._deleteBtn.disabled = true;
		this._clearSettings();
		this._clearAssets();
		this._syncStatus();
	}

	// ---- toolbar ----
	private _onAddPackage(): void {
		console.log("===============_onAddPackage============");
		this._showInput("Package Name", "NewPackage", (s) => {
			if (s.trim() == "") return;
			addPackage(this.db, s.trim());
			this._rebuild();
			this.dirty = true;
			this._statusLabel.text = "Added package: " + s;
		});
	}
	private _onRename(): void {
		console.log("===============_onRename============");
		if (this._selectedGroupName) {
			let p = this.db.packages[this._selectedPkgName];
			if (p == null) return;
			let g = p.groups[this._selectedGroupName];
			if (g == null) return;
			this._showInput("Group Name", this._selectedGroupName, (s) => {
				if (s.trim() == "") return;
				renameGroup(this.db, this._selectedPkgName, this._selectedGroupName, s.trim());
				this._rebuild();
				this.dirty = true;
			});
		} else if (this._selectedPkgName) {
			let p = this.db.packages[this._selectedPkgName];
			if (p == null) return;
			this._showInput("Package Name", this._selectedPkgName, (s) => {
				if (s.trim() == "") return;
				renamePackage(this.db, this._selectedPkgName, s.trim());
				this._rebuild();
				this.dirty = true;
			});
		}
	}
	private _onDelete(): void {
		console.log("===============_onDelete============");
		if (this._selectedGroupName) {
			removeGroup(this.db, this._selectedPkgName, this._selectedGroupName);
			this._selectedGroupName = "";
			this._rebuild();
			this.dirty = true;
			this._clearAssets();
			this._statusLabel.text = "Deleted group";
		} else if (this._selectedPkgName) {
			removePackage(this.db, this._selectedPkgName);
			this._selectedPkgName = "";
			this._selectedGroupName = "";
			this._rebuild();
			this.dirty = true;
			this._clearAssets();
			this._statusLabel.text = "Deleted package";
		}
	}

	// ---- popup ----
	private _onPopup(id: number): void {
		console.log("===============_onPopup============");
		let pname = this._selectedPkgName, gname = this._selectedGroupName;
		switch (id) {
			case 101:
				this._showInput("Group Name", "NewGroup", (s) => {
					if (s.trim() == "" || pname == "") return;
					addGroup(this.db, pname, s.trim());
					this._rebuild();
					this.dirty = true;
				});
				break;
			case 102: this._onRename(); break;
			case 103: this._onDelete(); break;
			case 201: this._onRename(); break;
			case 202: this._onDelete(); break;
			case 203:
				clearGroupItems(this.db, pname, gname);
				this._rebuild();
				this._syncAssets();
				this.dirty = true;
				this._statusLabel.text = "Cleared assets";
				break;
		}
	}

	// ---- input dialog ----
	private _showInput(title: string, def: string, cb: (s: string) => void): void {
		console.log("===============_showInput============");
		this._inputDlg.title = title;
		this._inputEdit.text = def;
		this._inputEdit.select_all();
		this._inputCb = cb;
		// Position dialog near mouse rather than screen center
		let mpos = this._mousePos();
		let dlgSize = new Vector2i(300, 100);
		this._inputDlg.popup();
		(this._inputDlg as any).size = dlgSize;
		let pos = new Vector2i(
			Math.max(0, Math.round(mpos.x - dlgSize.x / 2)),
			Math.max(0, Math.round(mpos.y - dlgSize.y / 2))
		);
		(this._inputDlg as any).position = pos;
		this._inputEdit.grab_focus();
	}

	// ---- asset view ----
	private _clearAssets(): void {
		while (this._assetVBox.get_child_count() > 0) {
			let c = this._assetVBox.get_child(0);
			this._assetVBox.remove_child(c);
			c.queue_free();
		}
	}
	private _hint(t: string): void {
		let lb = new Label();
		lb.text = t;
		this._assetVBox.add_child(lb);
	}
	private _clearSettings(): void {
		while (this._settingsBox.get_child_count() > 0) {
			let c = this._settingsBox.get_child(0);
			this._settingsBox.remove_child(c);
			c.queue_free();
		}
	}
	private _syncSettings(): void {
		this._clearSettings();
		if (!this._selectedPkgName) return;
		let pkg = this.db.packages[this._selectedPkgName];
		if (pkg == null) return;

		let title = new Label();
		title.text = this._selectedGroupName ? "Group Settings" : "Package Settings";
		this._settingsBox.add_child(title);

		let encrypt = new CheckBox();
		encrypt.text = "Encrypt";
		if (this._selectedGroupName) {
			let group = pkg.groups[this._selectedGroupName];
			if (group == null) return;
			encrypt.set_pressed_no_signal(group.isEncrypt);
			encrypt.pressed.connect(Callable.create(() => {
				group.isEncrypt = encrypt.button_pressed;
				this._rebuild();
				this._syncSettings();
				this.dirty = true;
			}) as any);
		} else {
			encrypt.set_pressed_no_signal(pkg.isEncrypt);
			encrypt.pressed.connect(Callable.create(() => {
				pkg.isEncrypt = encrypt.button_pressed;
				this._rebuild();
				this._syncSettings();
				this.dirty = true;
			}) as any);
		}
		this._settingsBox.add_child(encrypt);

		if (!this._selectedGroupName) {
			let row = new HBoxContainer();
			this._settingsBox.add_child(row);
			let lb = new Label();
			lb.text = "Download Priority";
			row.add_child(lb);

			let priority = new OptionButton();
			priority.add_item("Must", 0);
			priority.add_item("High", 1);
			priority.add_item("Low", 2);
			priority.select(Math.max(0, Math.min(2, pkg.downloadPriority)));
			priority.item_selected.connect(Callable.create((index: number) => {
				pkg.downloadPriority = priority.get_item_id(index);
				this._rebuild();
				this._syncSettings();
				this.dirty = true;
			}) as any);
			row.add_child(priority);
		} else {
			let note = new Label();
			note.text = pkg.isEncrypt ? "Effective Encrypt: true (package)" : "Effective Encrypt: group value";
			this._settingsBox.add_child(note);
		}
		this._settingsBox.add_child(new HSeparator());
	}
	private _syncAssets(): void {
		this._clearAssets();
		if (!this._selectedPkgName || !this._selectedGroupName) { this._hint("Select a group."); return; }
		let p = this.db.packages[this._selectedPkgName];
		if (p == null) return;
		let g = p.groups[this._selectedGroupName];
		if (g == null) return;

		let hd = new Label();
		hd.text = this._selectedPkgName + " / " + this._selectedGroupName;
		this._assetVBox.add_child(hd);

		let ct = new Label();
		ct.text = Object.keys(g.items).length + " entries";
		this._assetVBox.add_child(ct);
		this._assetVBox.add_child(new HSeparator());

		let pname = this._selectedPkgName, gname = this._selectedGroupName;
		for (let [path, item] of Object.entries(g.items)) {
			let entry = new VBoxContainer();
			entry.size_flags_horizontal = 3;
			this._assetVBox.add_child(entry);

			// Row 1: Asset info + remove button
			let row = new HBoxContainer();
			row.size_flags_horizontal = 3;
			entry.add_child(row);

			let tr = new TextureRect();
			tr.texture = this._iconRes;
			tr.stretch_mode = TextureRect.StretchMode.STRETCH_KEEP;
			tr.custom_minimum_size = new Vector2(20, 20);
			row.add_child(tr);

			let tl = new Label();
			tl.text = "[" + item.type + "]";
			tl.custom_minimum_size = new Vector2(50, 0);
			row.add_child(tl);

			let pl = new Label();
			pl.text = path;
			pl.size_flags_horizontal = 3;
			row.add_child(pl);

			let rPath = path;

			let rm = new Button();
			rm.text = "X";
			rm.custom_minimum_size = new Vector2(30, 0);
			row.add_child(rm);

			// Use a callback wrapper to handle the remove button click
			let removeId = this._addRemoveCallback(pname, gname, rPath);
			rm.pressed.connect(Callable.create(this._makeRemoveHandler(removeId)) as any);

			// Row 2: Keys
			let keysRow = new HBoxContainer();
			keysRow.size_flags_horizontal = 3;
			entry.add_child(keysRow);

			// Indentation spacer — keys below asset info, separate from delete button row
			let indent = new Control();
			indent.custom_minimum_size = new Vector2(24, 0);
			keysRow.add_child(indent);

			let keysLabel = new Label();
			keysLabel.text = "Keys:";
			keysLabel.custom_minimum_size = new Vector2(36, 0);
			keysRow.add_child(keysLabel);

			if (item.keys && item.keys.length > 0) {
				for (let key of item.keys) {
					let keyTag = new HBoxContainer();
					let kl = new Label();
					kl.text = key;
					keyTag.add_child(kl);
					let rk = new Button();
					rk.text = "×";
					rk.custom_minimum_size = new Vector2(20, 0);
					keyTag.add_child(rk);
					keysRow.add_child(keyTag);

					let rkId = this._addRemoveKeyCallback(pname, gname, rPath, key);
					rk.pressed.connect(Callable.create(this._makeRemoveKeyHandler(rkId)) as any);
				}
			}

			let addKeyBtn = new Button();
			addKeyBtn.text = "+";
			addKeyBtn.custom_minimum_size = new Vector2(24, 0);
			addKeyBtn.tooltip_text = "Add key";
			keysRow.add_child(addKeyBtn);
			addKeyBtn.pressed.connect(Callable.create(() => {
				this._showInput("Add Key", "", (s) => {
					if (s.trim() == "") return;
					addKeyToAsset(this.db, pname, gname, rPath, s.trim());
					this._syncAssets();
					this._rebuild();
					this.dirty = true;
				});
			}) as any);
		}

		// Build expanded list inline to avoid cross-module GArray issues
		let expanded: string[] = [];
		for (let [path, item] of Object.entries(g.items)) {
			if (item.type == "folder") {
				this._collectFolderFiles(path, expanded);
			} else {
				expanded.push(path);
			}
		}
		if (expanded.length > 0) {
			this._assetVBox.add_child(new HSeparator());
			let el = new Label();
			el.text = "Expanded (" + expanded.length + " files):";
			this._assetVBox.add_child(el);
			for (let fp of expanded) {
				let row = new HBoxContainer();
				row.size_flags_horizontal = 3;
				this._assetVBox.add_child(row);
				let tr = new TextureRect();
				tr.texture = this._iconRes;
				tr.stretch_mode = TextureRect.StretchMode.STRETCH_KEEP;
				tr.custom_minimum_size = new Vector2(16, 16);
				row.add_child(tr);
				let pl = new Label();
				pl.text = fp;
				pl.size_flags_horizontal = 3;
				row.add_child(pl);
			}
		}
	}

	// Store pending remove callbacks
	private _removeCallbacks: Map<number, () => void> = new Map();
	private _removeNextId = 1;
	private _addRemoveCallback(pname: string, gname: string, path: string): number {
		if (!this._removeCallbacks) this._removeCallbacks = new Map();
		if (!this._removeNextId) this._removeNextId = 1;
		let id = this._removeNextId++;
		this._removeCallbacks.set(id, () => {
			removeAssetFromGroup(this.db, pname, gname, path);
			this._syncAssets();
			this._rebuild();
			this.dirty = true;
		});
		return id;
	}
	private _onRemoveClicked(id: number): void {
		if (!this._removeCallbacks) return;
		let cb = this._removeCallbacks.get(id);
		if (cb) { cb(); this._removeCallbacks.delete(id); }
	}
	private _makeRemoveHandler(id: number): any {
		return (): void => this._onRemoveClicked(id);
	}

	// ---- key management ----
	private _removeKeyCallbacks: Map<number, () => void> = new Map();
	private _removeKeyNextId = 1;
	private _addRemoveKeyCallback(pname: string, gname: string, path: string, key: string): number {
		if (!this._removeKeyCallbacks) this._removeKeyCallbacks = new Map();
		if (!this._removeKeyNextId) this._removeKeyNextId = 1;
		let id = this._removeKeyNextId++;
		this._removeKeyCallbacks.set(id, () => {
			removeKeyFromAsset(this.db, pname, gname, path, key);
			this._syncAssets();
			this._rebuild();
			this.dirty = true;
		});
		return id;
	}
	private _onRemoveKeyClicked(id: number): void {
		if (!this._removeKeyCallbacks) return;
		let cb = this._removeKeyCallbacks.get(id);
		if (cb) {
			cb();
			this._removeKeyCallbacks.delete(id);
		}
	}
	private _makeRemoveKeyHandler(id: number): any {
		return (): void => this._onRemoveKeyClicked(id);
	}

	// ---- folder scanning ----
	private _collectFolderFiles(folderPath: string, output: string[]): void {
		let dir: DirAccess | null = DirAccess.open(folderPath);
		if (dir == null) return;
		dir.list_dir_begin();
		let entry: string = dir.get_next();
		while (entry != "") {
			if (entry != "." && entry != "..") {
				let fp: string = folderPath.endsWith("/") ? folderPath + entry : folderPath + "/" + entry;
				if (dir.current_is_dir()) {
					this._collectFolderFiles(fp, output);
				} else {
					output.push(fp);
				}
			}
			entry = dir.get_next();
		}
		dir.list_dir_end();
	}

	// ---- drag & drop ----
	/** Called when a drag starts over the Tree — we don't start drags ourselves */
	private _drag_begin(_pos: Vector2): any {
		return null;
	}

	/** Called repeatedly during drag to check if drop is allowed over a Group */
	private _drag_can(_pos: Vector2, data: any): boolean {
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
	private _drag_drop(_pos: Vector2, data: any): void {
		const ti = this._tree.get_item_at_position(_pos);
		if (ti == null) return;
		const m = this._getMeta(ti);
		if (m == null || m[META_TYPE] != ItemKind.GROUP) return;
		const pname = m[META_PKG_NAME], gname = m[META_GROUP_NAME];
		this._handleDropData(pname, gname, data);
	}
	_get_drag_data(_at_position: Vector2): any {
		return null; // We only handle drops, not drags
	}
	private _getDropTargetGroupMeta(pos?: Vector2): any {
		let ti: TreeItem | null = null;
		if (pos != null) {
			// 1 — Try pos directly (coordinate system depends on propagation)
			ti = this._tree.get_item_at_position(pos);
			// 2 — Panel-local → tree-local via get_global_rect()
			if (ti == null) {
				const panelRect = this.get_global_rect();
				const treeRect = this._tree.get_global_rect();
				const treeLocal = new Vector2(
					pos.x + panelRect.position.x - treeRect.position.x,
					pos.y + panelRect.position.y - treeRect.position.y,
				);
				ti = this._tree.get_item_at_position(treeLocal);
			}
			// 3 — Fallback: use selected item
			if (ti == null) {
				ti = this._tree.get_selected();
			}
		} else {
			ti = this._tree.get_selected();
		}
		if (ti == null)
			return null;
		let m = this._getMeta(ti);
		if (m == null || m[META_TYPE] != ItemKind.GROUP)
			return null;
		return m;
	}
	_can_drop_data(at_position: Vector2, data: any): boolean {
		if (data == null || typeof data != 'object') return false;
		let m = this._getDropTargetGroupMeta(at_position);
		if (m == null) return false;
		return true;
	}

	_drop_data(at_position: Vector2, data: any): void {
		let m = this._getDropTargetGroupMeta(at_position);
		if (m == null) return;
		let pname = m[META_PKG_NAME], gname = m[META_GROUP_NAME];
		this._handleDropData(pname, gname, data);
	}

	private _handleDropData(pname: string, gname: string, data: any): void {

		// --- Extract the list of file/folder paths from drag data ---
		// Godot 4 FileSystem dock provides:  { 'type': 'files', 'files': PackedStringArray }
		// The `data` comes as a GDictionary / Variant.  Try several access patterns.
		let files: string[] = [];

		// 1 — Try proxy() unwrap first (GDictionary proxy -> JS object)
		let d: any;
		if (typeof (data as any).proxy === "function") {
			d = (data as any).proxy();
		} else {
			d = data;
		}

		// 2 — Try bracket-notation access on the (possibly unwrapped) data
		let filesRaw: any = null;
		if (d != null) {
			if (d["files"] !== undefined) {
				filesRaw = d["files"];
			} else if (typeof d.get === "function") {
				// GDictionary native accessor
				let v = d.get("files");
				if (v != null) filesRaw = v;
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
			let isDir = fp.endsWith("/") || fp.endsWith("\\") || DirAccess.dir_exists_absolute(fp);
			if (addAssetToGroup(this.db, pname, gname, fp, isDir ? "folder" : "file")) added++;
		}
		if (added > 0) {
			this._rebuild();
			this._syncAssets();
			this.dirty = true;
			this._statusLabel.text = "Added " + added + " asset(s)";
		} else {
			this._statusLabel.text = "No new assets (duplicates skipped)";
		}
	}

	// ---- status ----
	private _syncStatus(): void {
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
				this._statusLabel.text = this._selectedPkgName + " - " + Object.keys(p.groups).length + " groups"; return;
			}
		}
		this._statusLabel.text = (this.dirty ? "Unsaved | " : "") + Object.keys(this.db.packages).length + " packages";
	}

	// ---- public API ----
	public addFilesToGroup(files: string[], pkgName: string, groupName: string): void {
		let c = 0;
		for (let fp of files) {
			let isDir = fp.endsWith("/") || fp.endsWith("\\") || DirAccess.dir_exists_absolute(fp);
			if (addAssetToGroup(this.db, pkgName, groupName, fp, isDir ? "folder" : "file")) c++;
		}
		if (c > 0) { this._rebuild(); this._syncAssets(); this.dirty = true; }
	}

	// ---- helpers ----
	/** Normalise a GArray / PackedStringArray / plain string[]. */
	private _normaliseStringArray(value: any): string[] {
		if (value == null) return [];
		if (Array.isArray(value)) {
			return (value as string[]).map(x => String(x));
		}
		// GArray with .size() + .get_indexed()
		if (typeof (value as any).size === "function" && typeof (value as any).get_indexed === "function") {
			let sz = (value as any).size();
			let res: string[] = [];
			for (let i = 0; i < sz; i++) {
				let v = (value as any).get_indexed(i);
				res.push(v != null ? String(v) : "");
			}
			return res;
		}
		// GArray with .proxy()
		if (typeof (value as any).proxy === "function") {
			let p = (value as any).proxy();
			if (Array.isArray(p)) {
				return (p as string[]).map(x => String(x));
			}
		}
		// Single string
		if (typeof value === "string") {
			return [value];
		}
		return [];
	}

}
