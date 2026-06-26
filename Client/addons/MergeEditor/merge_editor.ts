import {
    Button,
    Callable,
    CheckBox,
    Color,
    DirAccess,
    FileAccess,
    GridContainer,
    HBoxContainer,
    HSeparator,
    Label,
    LineEdit,
    OptionButton,
    ResourceLoader,
    ScrollContainer,
    Texture2D,
    Vector2,
    VBoxContainer,
} from "godot";
import { MergeConst } from "../../Game/Merge/MergeConst";

enum OperateType {
    None,
    CreateCell,
    RemoveCell,
    CreateItem,
    RemoveItem,
    CreateCover,
    RemoveCover,
}

interface MergeEditorRowJson {
    element: number[];
}

interface MergeEditorDataJson {
    grids: MergeEditorRowJson[];
}

interface MergeEditorItem {
    id: number;
    iconPath: string;
    icon: Texture2D | null;
}

class MergeEditorGridData {
    public isUsed: boolean = true;
    public itemId: number = 0;
    public coverId: number = 0;
}

export default class MergeEditorPanel extends VBoxContainer {
    private static readonly MaxRow: number = 7;
    private static readonly MaxCol: number = 9;
    private static readonly DataDir: string = "res://Assets/MergeData";
    private static readonly ItemResourceDir: string = "res://Resources/Merge/Items";
    private static readonly CoverResourceDir: string = "res://Resources/Merge/Covers";

    private levelInput!: LineEdit;
    private operationSelect!: OptionButton;
    private batchCheck!: CheckBox;
    private itemList!: OptionButton;
    private coverList!: OptionButton;
    private board!: GridContainer;
    private statusLabel!: Label;

    private readonly grids: MergeEditorGridData[][] = [];
    private readonly gridButtons: Button[][] = [];
    private readonly allItems: MergeEditorItem[] = [];
    private readonly allCovers: MergeEditorItem[] = [];
    private selectedCell: { row: number; col: number } | null = null;

    _ready(): void {
        this._buildUI();
        this._initResources();
        this._initBoard();
        this._refreshSelectors();
        this._refreshBoard();
    }

    private _buildUI(): void {
        this.size_flags_horizontal = 3;
        this.size_flags_vertical = 3;

        const topBar = new HBoxContainer();
        topBar.size_flags_horizontal = 3;
        this.add_child(topBar);

        const title = new Label();
        title.text = "Merge Board";
        title.custom_minimum_size = new Vector2(110, 0);
        topBar.add_child(title);

        this.levelInput = new LineEdit();
        this.levelInput.text = "test";
        this.levelInput.placeholder_text = "level";
        this.levelInput.custom_minimum_size = new Vector2(160, 0);
        topBar.add_child(this.levelInput);

        const loadButton = new Button();
        loadButton.text = "Load JSON";
        loadButton.pressed.connect(Callable.create(this, "_onLoadPressed") as any);
        topBar.add_child(loadButton);

        const saveButton = new Button();
        saveButton.text = "Save JSON";
        saveButton.pressed.connect(Callable.create(this, "_onSavePressed") as any);
        topBar.add_child(saveButton);

        const resetButton = new Button();
        resetButton.text = "Reset";
        resetButton.pressed.connect(Callable.create(this, "_onResetPressed") as any);
        topBar.add_child(resetButton);

        const reloadAssetsButton = new Button();
        reloadAssetsButton.text = "Reload Assets";
        reloadAssetsButton.pressed.connect(Callable.create(this, "_onReloadAssetsPressed") as any);
        topBar.add_child(reloadAssetsButton);

        this.add_child(new HSeparator());

        const editBar = new HBoxContainer();
        editBar.size_flags_horizontal = 3;
        this.add_child(editBar);

        this.operationSelect = new OptionButton();
        this.operationSelect.custom_minimum_size = new Vector2(180, 0);
        this._addOperationItems();
        editBar.add_child(this.operationSelect);

        this.batchCheck = new CheckBox();
        this.batchCheck.text = "Batch drag";
        editBar.add_child(this.batchCheck);

        this.itemList = new OptionButton();
        this.itemList.custom_minimum_size = new Vector2(220, 0);
        editBar.add_child(this.itemList);

        this.coverList = new OptionButton();
        this.coverList.custom_minimum_size = new Vector2(180, 0);
        editBar.add_child(this.coverList);

        const scroll = new ScrollContainer();
        scroll.size_flags_horizontal = 3;
        scroll.size_flags_vertical = 3;
        this.add_child(scroll);

        this.board = new GridContainer();
        this.board.columns = MergeEditorPanel.MaxCol;
        this.board.size_flags_horizontal = 3;
        this.board.size_flags_vertical = 3;
        scroll.add_child(this.board);

        this.add_child(new HSeparator());

        this.statusLabel = new Label();
        this.statusLabel.text = "Ready";
        this.add_child(this.statusLabel);
    }

    private _addOperationItems(): void {
        const names = ["None", "Create Cell", "Remove Cell", "Create Item", "Remove Item", "Create Cover", "Remove Cover"];
        for (let i = 0; i < names.length; ++i) {
            this.operationSelect.add_item(names[i], i);
        }
        this.operationSelect.select(OperateType.CreateItem);
    }

    private _initResources(): void {
        this.allItems.length = 0;
        this.allCovers.length = 0;
        this._scanItems();
        this._scanCovers();
        this.allItems.push({
            id: MergeConst.mergeBoxId,
            iconPath: "",
            icon: null,
        });
    }

    private _scanItems(): void {
        const dir = DirAccess.open(MergeEditorPanel.ItemResourceDir);
        if (dir == null) {
            return;
        }
        dir.list_dir_begin();
        let entry = dir.get_next();
        while (entry !== "") {
            if (!dir.current_is_dir() && entry.toLowerCase().endsWith(".png")) {
                const id = Number(entry.substring(0, entry.length - 4));
                if (Number.isFinite(id)) {
                    const path = MergeEditorPanel.ItemResourceDir + "/" + entry;
                    this.allItems.push({ id, iconPath: path, icon: ResourceLoader.load(path) as Texture2D | null });
                }
            }
            entry = dir.get_next();
        }
        dir.list_dir_end();
        this.allItems.sort((a, b) => a.id - b.id);
    }

    private _scanCovers(): void {
        const dir = DirAccess.open(MergeEditorPanel.CoverResourceDir);
        if (dir == null) {
            return;
        }
        dir.list_dir_begin();
        let entry = dir.get_next();
        while (entry !== "") {
            if (!dir.current_is_dir() && entry.toLowerCase().endsWith(".png")) {
                const id = Number(entry.substring(0, entry.length - 4));
                if (Number.isFinite(id)) {
                    const path = MergeEditorPanel.CoverResourceDir + "/" + entry;
                    this.allCovers.push({ id, iconPath: path, icon: ResourceLoader.load(path) as Texture2D | null });
                }
            }
            entry = dir.get_next();
        }
        dir.list_dir_end();
        this.allCovers.sort((a, b) => a.id - b.id);
    }

    private _initBoard(): void {
        this.grids.length = 0;
        this.gridButtons.length = 0;
        this._clearBoardButtons();
        for (let row = 0; row < MergeEditorPanel.MaxRow; ++row) {
            const gridRow: MergeEditorGridData[] = [];
            const buttonRow: Button[] = [];
            for (let col = 0; col < MergeEditorPanel.MaxCol; ++col) {
                const grid = new MergeEditorGridData();
                gridRow.push(grid);

                const button = new Button();
                button.custom_minimum_size = new Vector2(82, 64);
                button.focus_mode = 0;
                button.pressed.connect(Callable.create(() => this._onGridPressed(row, col)) as any);
                button.mouse_entered.connect(Callable.create(() => this._onGridMouseEntered(row, col)) as any);
                this.board.add_child(button);
                buttonRow.push(button);
            }
            this.grids.push(gridRow);
            this.gridButtons.push(buttonRow);
        }
        this.grids[MergeEditorPanel.MaxRow - 1][0].itemId = MergeConst.mergeBoxId;
    }

    private _clearBoardButtons(): void {
        if (this.board == null) {
            return;
        }
        while (this.board.get_child_count() > 0) {
            const child = this.board.get_child(0);
            this.board.remove_child(child);
            child.queue_free();
        }
    }

    private _refreshSelectors(): void {
        this.itemList.clear();
        for (let i = 0; i < this.allItems.length; ++i) {
            const item = this.allItems[i];
            this.itemList.add_item(item.id === MergeConst.mergeBoxId ? "Merge Box" : String(item.id), i);
            if (item.icon != null) {
                this.itemList.set_item_icon(i, item.icon);
            }
        }

        this.coverList.clear();
        this.coverList.add_item("No Cover", 0);
        for (let i = 0; i < this.allCovers.length; ++i) {
            const cover = this.allCovers[i];
            const index = i + 1;
            this.coverList.add_item(String(cover.id), index);
            if (cover.icon != null) {
                this.coverList.set_item_icon(index, cover.icon);
            }
        }
    }

    private _refreshBoard(): void {
        for (let row = 0; row < MergeEditorPanel.MaxRow; ++row) {
            for (let col = 0; col < MergeEditorPanel.MaxCol; ++col) {
                this._refreshButton(row, col);
            }
        }
    }

    private _refreshButton(row: number, col: number): void {
        const grid = this.grids[row][col];
        const button = this.gridButtons[row][col];
        const selected = this.selectedCell != null && this.selectedCell.row === row && this.selectedCell.col === col;
        button.disabled = row === MergeEditorPanel.MaxRow - 1 && col === 0;
        button.text = this._getButtonText(row, col, grid);
        button.icon = this._findItem(grid.itemId)?.icon ?? null;
        button.modulate = selected ? new Color(1, 0.85, 0.85, 1) : grid.isUsed ? new Color(0.82, 1, 0.82, 1) : new Color(0.35, 0.35, 0.35, 1);
    }

    private _getButtonText(row: number, col: number, grid: MergeEditorGridData): string {
        if (!grid.isUsed) {
            return `${row},${col}\nEmpty`;
        }
        const itemText = grid.itemId === 0 ? "Item: -" : grid.itemId === MergeConst.mergeBoxId ? "Box" : `Item: ${grid.itemId}`;
        const coverText = grid.coverId === 0 ? "Cover: -" : `Cover: ${grid.coverId}`;
        return `${row},${col}\n${itemText}\n${coverText}`;
    }

    private _onGridPressed(row: number, col: number): void {
        this._applyOperation(row, col);
    }

    private _onGridMouseEntered(row: number, col: number): void {
        if (!this.batchCheck.button_pressed) {
            return;
        }
        this._applyOperation(row, col);
    }

    private _applyOperation(row: number, col: number): void {
        if (row === MergeEditorPanel.MaxRow - 1 && col === 0) {
            return;
        }
        const grid = this.grids[row][col];
        this.selectedCell = { row, col };
        switch (this.operationSelect.selected as OperateType) {
            case OperateType.CreateCell:
                grid.isUsed = true;
                break;
            case OperateType.RemoveCell:
                grid.isUsed = false;
                grid.itemId = 0;
                grid.coverId = 0;
                break;
            case OperateType.CreateItem:
                grid.isUsed = true;
                grid.itemId = this._getSelectedItemId();
                break;
            case OperateType.RemoveItem:
                grid.itemId = 0;
                break;
            case OperateType.CreateCover:
                grid.isUsed = true;
                grid.coverId = this._getSelectedCoverId();
                break;
            case OperateType.RemoveCover:
                grid.coverId = 0;
                break;
        }
        this._refreshBoard();
        this._setStatus(`Edited ${row},${col}`);
    }

    private _getSelectedItemId(): number {
        const index = this.itemList.selected;
        return this.allItems[index]?.id ?? 0;
    }

    private _getSelectedCoverId(): number {
        const selected = this.coverList.selected;
        if (selected <= 0) {
            return 0;
        }
        return this.allCovers[selected - 1]?.id ?? 0;
    }

    private _findItem(id: number): MergeEditorItem | null {
        return this.allItems.find((item) => item.id === id) ?? null;
    }

    private _onLoadPressed(): void {
        const path = this._getLevelPath();
        const file = FileAccess.open(path, FileAccess.ModeFlags.READ);
        if (file == null) {
            this._setStatus("Load failed: " + path);
            return;
        }
        const text = file.get_as_text();
        file.close();

        let data: MergeEditorDataJson;
        try {
            data = JSON.parse(text) as MergeEditorDataJson;
        } catch (_e) {
            this._setStatus("Load failed: invalid json");
            return;
        }
        this._loadData(data);
        this._refreshBoard();
        this._setStatus("Loaded " + path);
    }

    private _onSavePressed(): void {
        const path = this._getLevelPath();
        if (!DirAccess.dir_exists_absolute(MergeEditorPanel.DataDir)) {
            DirAccess.make_dir_recursive_absolute(MergeEditorPanel.DataDir);
        }
        const file = FileAccess.open(path, FileAccess.ModeFlags.WRITE);
        if (file == null) {
            this._setStatus("Save failed: " + path);
            return;
        }
        file.store_string(JSON.stringify(this._buildData(), null, "\t"));
        file.close();
        this._setStatus("Saved " + path);
    }

    private _onResetPressed(): void {
        this._initBoard();
        this._refreshBoard();
        this._setStatus("Reset board");
    }

    private _onReloadAssetsPressed(): void {
        this._initResources();
        this._refreshSelectors();
        this._refreshBoard();
        this._setStatus("Reloaded item and cover resources");
    }

    private _loadData(data: MergeEditorDataJson): void {
        for (let row = 0; row < MergeEditorPanel.MaxRow; ++row) {
            const sourceRow = data.grids[row];
            for (let col = 0; col < MergeEditorPanel.MaxCol; ++col) {
                const value = sourceRow?.element[col] ?? 0;
                const grid = this.grids[row][col];
                grid.isUsed = value !== 0;
                grid.itemId = Math.floor(value / 10);
                grid.coverId = value % 10;
            }
        }
        this.grids[MergeEditorPanel.MaxRow - 1][0].isUsed = true;
        this.grids[MergeEditorPanel.MaxRow - 1][0].itemId = MergeConst.mergeBoxId;
        this.grids[MergeEditorPanel.MaxRow - 1][0].coverId = 0;
    }

    private _buildData(): MergeEditorDataJson {
        const data: MergeEditorDataJson = { grids: [] };
        for (let row = 0; row < MergeEditorPanel.MaxRow; ++row) {
            const rowJson: MergeEditorRowJson = { element: [] };
            for (let col = 0; col < MergeEditorPanel.MaxCol; ++col) {
                const grid = this.grids[row][col];
                rowJson.element.push(grid.isUsed ? grid.itemId * 10 + grid.coverId : 0);
            }
            data.grids.push(rowJson);
        }
        return data;
    }

    private _getLevelPath(): string {
        const level = this.levelInput.text.trim() === "" ? "test" : this.levelInput.text.trim();
        return MergeEditorPanel.DataDir + "/" + level + ".json";
    }

    private _setStatus(text: string): void {
        this.statusLabel.text = text;
    }
}

