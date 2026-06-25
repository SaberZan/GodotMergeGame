import { FileAccess, DirAccess, PCKPacker, ResourceLoader } from "godot";

export interface AssetItem {
    type: "file" | "folder";
    keys: string[];
}

type AssetInfoExport = { deps: string[]; needGroup: string[]; keys: string[]; uid?: string; typeIndex?: number };

function warnOnce(warnings: string[] | undefined, message: string): void {
    if (warnings == null) return;
    if (warnings.indexOf(message) < 0) warnings.push(message);
}

function parseResourceRef(path: string): { path: string; uid: string } {
    const uidSplit = path.lastIndexOf("::::");
    if (uidSplit >= 0) {
        return {
            path: path.substring(uidSplit + 4),
            uid: path.substring(0, uidSplit),
        };
    }
    return { path, uid: "" };
}

function collectDirectResourceDeps(path: string): { paths: string[]; uids: Map<string, string> } {
    const normalizedPath = normalizeResourcePath(path);
    const result: string[] = [];
    const uids = new Map<string, string>();
    if (normalizedPath === "" || !FileAccess.file_exists(normalizedPath)) {
        return { paths: result, uids };
    }

    const deps = ResourceLoader.get_dependencies(normalizedPath);
    if (!deps) return { paths: result, uids };
    for (let i = 0; i < deps.size(); i++) {
        const depRef = parseResourceRef(String(deps.get(i)));
        const normalizedDep = depRef.path;
        if (normalizedDep === "") continue;
        if (depRef.uid !== "") uids.set(normalizedDep, depRef.uid);
        if (result.indexOf(normalizedDep) < 0) result.push(normalizedDep);
    }
    return { paths: result, uids };
}

function collectResourceDeps(path: string, out: Set<string>, uids: Map<string, string>): void {
    const deps = collectDirectResourceDeps(path);
    for (const [depPath, uid] of deps.uids) {
        if (!uids.has(depPath)) uids.set(depPath, uid);
    }
    for (const dep of deps.paths) {
        if (out.has(dep)) continue;
        out.add(dep);
        collectResourceDeps(dep, out, uids);
    }
}

export interface GroupConfig {
    isEncrypt: boolean;
    items: Record<string, AssetItem>;  // keyed by asset path
}

export interface PackageConfig {
    isEncrypt: boolean;
    downloadPriority: number;
    groups: Record<string, GroupConfig>;  // keyed by group name
}

export interface AssetDBData {
    version: number;
    versionCode: number;
    packages: Record<string, PackageConfig>;  // keyed by package name
}

export interface CatalogsExport {
    version: number;
    versionCode: number;
    packages: Record<string, {}>;
    allEasyAssetBundleInfos: Record<string, { easyAssetBundleType: number; abName: string; md5: string; size: number; crc: number; packages: string[]; location: number; isEncrypt: boolean; abDownloadPriority: number }>;
    allActiveEasyAssetInfos: Record<string, AssetInfoExport>;
    allPassiveEasyAssetInfos: Record<string, AssetInfoExport>;
    assemblyQualifiedNames: string[];
}

export interface PckExportResult {
    catalogs: CatalogsExport;
    outputDir: string;
    exported: string[];
    warnings: string[];
    errors: string[];
}

const DB_PATH: string = "res://addons/AssetEditor/asset_db.json";
const DEFAULT_DOWNLOAD_PRIORITY = 0;
const OK = 0;
const PCK_OUTPUT_DIR = "res://AssetBundles";

const CRC32_TABLE: number[] = (() => {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) !== 0 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function normalizeResourcePath(path: string): string {
    return parseResourceRef(path).path;
}

function getResourceTypeName(path: string, warnings?: string[]): string {
    const normalizedPath = normalizeResourcePath(path);
    if (normalizedPath === "" || !FileAccess.file_exists(normalizedPath)) {
        return "";
    }

    const resource = ResourceLoader.load(normalizedPath);
    if (resource != null) {
        const typeName = resource.get_class();
        if (typeName !== "") return typeName;
    }

    if (normalizedPath.endsWith(".tscn") || normalizedPath.endsWith(".scn")) return "PackedScene";
    if (normalizedPath.endsWith(".tres") || normalizedPath.endsWith(".res")) return "Resource";

    warnOnce(warnings, "Failed to detect resource type: " + normalizedPath);
    return "";
}

function getResourceTypeIndex(path: string, assemblyQualifiedNames: string[], warnings?: string[]): number {
    const typeName = getResourceTypeName(path, warnings);
    if (typeName === "") return -1;

    let index = assemblyQualifiedNames.indexOf(typeName);
    if (index < 0) {
        index = assemblyQualifiedNames.length;
        assemblyQualifiedNames.push(typeName);
    }
    return index;
}

function safeFileName(name: string): string {
    return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

function joinPath(folder: string, fileName: string): string {
    return folder.endsWith("/") ? folder + fileName : folder + "/" + fileName;
}

function normalizeOutputDir(outputDir: string): string {
    return outputDir.endsWith("/") ? outputDir.substring(0, outputDir.length - 1) : outputDir;
}

function ensureDir(path: string): boolean {
    let dir = DirAccess.open(path);
    if (dir != null) return true;
    const parent = DirAccess.open("res://");
    if (parent == null) return false;
    const relative = path.startsWith("res://") ? path.substring(6) : path;
    return parent.make_dir_recursive(relative) === OK;
}

function getFileSize(path: string): number {
    const file = FileAccess.open(path, FileAccess.ModeFlags.READ);
    if (file == null) return 0;
    const size = file.get_length();
    file.close();
    return size;
}

function calculateFileCrc32(path: string): number {
    const file = FileAccess.open(path, FileAccess.ModeFlags.READ);
    if (file == null) return 0;
    let crc = 0xffffffff;
    while (file.get_position() < file.get_length()) {
        const remaining = file.get_length() - file.get_position();
        const buffer = file.get_buffer(Math.min(65536, remaining));
        for (let i = 0; i < buffer.size(); i++) {
            crc = CRC32_TABLE[(crc ^ buffer.get(i)) & 0xff] ^ (crc >>> 8);
        }
    }
    file.close();
    return (crc ^ 0xffffffff) >>> 0;
}

function addPackedFile(packer: PCKPacker, sourcePath: string, encrypt: boolean, added: Set<string>, warnings: string[]): boolean {
    const normalizedPath = normalizeResourcePath(sourcePath);
    if (normalizedPath === "" || added.has(normalizedPath)) return true;
    if (!FileAccess.file_exists(normalizedPath)) {
        warnings.push("Missing file skipped: " + sourcePath);
        return true;
    }
    const err = packer.add_file(normalizedPath, normalizedPath, encrypt);
    if (err !== OK) {
        warnings.push("Failed to add file to pck: " + normalizedPath + " error=" + err);
        return false;
    }
    added.add(normalizedPath);
    return true;
}

function collectBundleFiles(catalogs: CatalogsExport, groupName: string): string[] {
    const files = new Set<string>();
    for (const [path, info] of Object.entries(catalogs.allActiveEasyAssetInfos)) {
        if (info.needGroup.includes(groupName)) {
            files.add(path);
            for (const dep of info.deps) files.add(dep);
        }
    }
    for (const [path, info] of Object.entries(catalogs.allPassiveEasyAssetInfos)) {
        if (info.needGroup.includes(groupName)) {
            files.add(path);
            for (const dep of info.deps) files.add(dep);
        }
    }
    return Array.from(files);
}

function createDefaultData(): AssetDBData {
    return {
        version: Date.now(),
        versionCode: 0,
        packages: {},
    };
}

function normalizeDatabase(parsed: any): AssetDBData {
    if (parsed == null || typeof parsed !== "object") {
        return createDefaultData();
    }
    if (typeof parsed.version !== "number") parsed.version = Date.now();
    if (typeof parsed.versionCode !== "number") parsed.versionCode = 0;
    if (parsed.packages == null || typeof parsed.packages !== "object") parsed.packages = {};

    // Migrate old format (arrays) to new format (Records)
    if (Array.isArray(parsed.packages)) {
        const oldPackages = parsed.packages as any[];
        const newPackages: Record<string, PackageConfig> = {};
        for (const pkg of oldPackages) {
            const groups: Record<string, GroupConfig> = {};
            if (Array.isArray(pkg.groups)) {
                for (const grp of pkg.groups) {
                    const items: Record<string, AssetItem> = {};
                    if (Array.isArray(grp.items)) {
                        for (const item of grp.items) {
                            items[item.path] = { type: item.type, keys: item.keys || [] };
                        }
                    }
                    groups[grp.name] = { isEncrypt: !!grp.isEncrypt, items };
                }
            }
            newPackages[pkg.name] = {
                isEncrypt: !!pkg.isEncrypt,
                downloadPriority: typeof pkg.downloadPriority === "number" ? pkg.downloadPriority : DEFAULT_DOWNLOAD_PRIORITY,
                groups,
            };
        }
        parsed.packages = newPackages;
    }

    for (const pkgName of Object.keys(parsed.packages)) {
        const pkg = parsed.packages[pkgName];
        if (pkg == null || typeof pkg !== "object") {
            parsed.packages[pkgName] = { isEncrypt: false, downloadPriority: DEFAULT_DOWNLOAD_PRIORITY, groups: {} };
            continue;
        }
        if (typeof pkg.isEncrypt !== "boolean") pkg.isEncrypt = false;
        if (typeof pkg.downloadPriority !== "number") pkg.downloadPriority = DEFAULT_DOWNLOAD_PRIORITY;
        if (pkg.groups == null || typeof pkg.groups !== "object") pkg.groups = {};
        for (const grpName of Object.keys(pkg.groups)) {
            const grp = pkg.groups[grpName];
            if (grp == null || typeof grp !== "object") {
                pkg.groups[grpName] = { isEncrypt: false, items: {} };
                continue;
            }
            if (typeof grp.isEncrypt !== "boolean") grp.isEncrypt = false;
            if (grp.items == null || typeof grp.items !== "object") grp.items = {};
            for (const itemPath of Object.keys(grp.items)) {
                const item = grp.items[itemPath];
                if (!item.keys) item.keys = [];
            }
        }
    }
    return parsed as AssetDBData;
}

export function loadDatabase(): AssetDBData {
    let file: FileAccess | null = FileAccess.open(DB_PATH, FileAccess.ModeFlags.READ);
    if (file == null) {
        console.warn("AssetEditor: no existing database found, creating new one");
        return createDefaultData();
    }
    let content: string = file.get_as_text();
    file.close();
    try {
        let parsed: any = JSON.parse(content);
        if (parsed == null || typeof parsed !== "object") {
            console.error("AssetEditor: failed to parse database, returning empty");
            return createDefaultData();
        }
        return normalizeDatabase(parsed);
    } catch (e) {
        console.error("AssetEditor: error parsing database: " + e);
        return createDefaultData();
    }
}

export function saveDatabase(data: AssetDBData): boolean {
    let json: string = JSON.stringify(data, null, "\t");
    let file: FileAccess | null = FileAccess.open(DB_PATH, FileAccess.ModeFlags.WRITE);
    if (file == null) {
        console.error("AssetEditor: failed to open database file for writing");
        return false;
    }
    file.store_string(json);
    file.close();
    return true;
}

export function scanFolderRecursive(folderPath: string): string[] {
    let result: string[] = [];
    let dir: DirAccess | null = DirAccess.open(folderPath);
    if (dir == null) {
        console.warn("AssetEditor: cannot open directory: " + folderPath);
        return result;
    }
    dir.list_dir_begin();
    let entry: string = dir.get_next();
    while (entry != "") {
        if (entry == "." || entry == "..") {
            entry = dir.get_next();
            continue;
        }
        let fullPath: string = folderPath.endsWith("/") ? folderPath + entry : folderPath + "/" + entry;
        if (dir.current_is_dir()) {
            result.push(...scanFolderRecursive(fullPath));
        } else {
            result.push(fullPath);
        }
        entry = dir.get_next();
    }
    dir.list_dir_end();
    return result;
}

export function collectGroupAssets(data: AssetDBData, packageName: string, groupName: string): string[] {
    let pkg = data.packages[packageName];
    if (pkg == null) return [];
    let group = pkg.groups[groupName];
    if (group == null) return [];
    let result: string[] = [];
    for (let path of Object.keys(group.items)) {
        let item = group.items[path];
        if (item.type == "folder") {
            result.push(...scanFolderRecursive(path));
        } else {
            result.push(path);
        }
    }
    return result;
}

export function addAssetToGroup(data: AssetDBData, packageName: string, groupName: string, path: string, type: "file" | "folder", keys?: string[]): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    // avoid duplicates
    if (group.items[path]) return false;
    group.items[path] = { type, keys: keys || [] };
    return true;
}

export function removeAssetFromGroup(data: AssetDBData, packageName: string, groupName: string, path: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    if (!group.items[path]) return false;
    delete group.items[path];
    return true;
}

export function clearGroupItems(data: AssetDBData, packageName: string, groupName: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    group.items = {};
    return true;
}

export function addKeyToAsset(data: AssetDBData, packageName: string, groupName: string, path: string, key: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    let item = group.items[path];
    if (item == null) return false;
    if (item.keys.indexOf(key) === -1) item.keys.push(key);
    return true;
}

export function removeKeyFromAsset(data: AssetDBData, packageName: string, groupName: string, path: string, key: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    let item = group.items[path];
    if (item == null) return false;
    let idx = item.keys.indexOf(key);
    if (idx === -1) return false;
    item.keys.splice(idx, 1);
    return true;
}

export function setItemKeys(data: AssetDBData, packageName: string, groupName: string, path: string, keys: string[]): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    let item = group.items[path];
    if (item == null) return false;
    item.keys = keys;
    return true;
}

export function addPackage(data: AssetDBData, name: string): PackageConfig {
    let pkg: PackageConfig = { isEncrypt: false, downloadPriority: DEFAULT_DOWNLOAD_PRIORITY, groups: {} };
    data.packages[name] = pkg;
    return pkg;
}

export function removePackage(data: AssetDBData, packageName: string): boolean {
    if (!data.packages[packageName]) return false;
    delete data.packages[packageName];
    return true;
}

export function renamePackage(data: AssetDBData, packageName: string, newName: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    data.packages[newName] = pkg;
    delete data.packages[packageName];
    return true;
}

export function addGroup(data: AssetDBData, packageName: string, name: string): GroupConfig | null {
    let pkg = data.packages[packageName];
    if (pkg == null) return null;
    let group: GroupConfig = { isEncrypt: false, items: {} };
    pkg.groups[name] = group;
    return group;
}

export function removeGroup(data: AssetDBData, packageName: string, groupName: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    if (!pkg.groups[groupName]) return false;
    delete pkg.groups[groupName];
    return true;
}

export function renameGroup(data: AssetDBData, packageName: string, groupName: string, newName: string): boolean {
    let pkg = data.packages[packageName];
    if (pkg == null) return false;
    let group = pkg.groups[groupName];
    if (group == null) return false;
    pkg.groups[newName] = group;
    delete pkg.groups[groupName];
    return true;
}

export function exportCatalogs(data: AssetDBData, warnings?: string[]): CatalogsExport {
    const packages: Record<string, {}> = {};
    const allEasyAssetBundleInfos: Record<string, { easyAssetBundleType: number; abName: string; md5: string; size: number; crc: number; packages: string[]; location: number; isEncrypt: boolean; abDownloadPriority: number }> = {};
    const allActiveEasyAssetInfos: Record<string, AssetInfoExport> = {};
    const allPassiveEasyAssetInfos: Record<string, AssetInfoExport> = {};
    const assemblyQualifiedNames: string[] = [];
    const activePaths = new Set<string>();
    const assetUids = new Map<string, string>();

    for (const pkgName of Object.keys(data.packages)) {
        const pkg = data.packages[pkgName];
        packages[pkgName] = {};

        for (const groupName of Object.keys(pkg.groups)) {
            const group = pkg.groups[groupName];

            // Collect directly referenced assets separately from passive dependencies.
            const active = new Set<string>();
            const passive = new Set<string>();
            const assetKeys: Map<string, Set<string>> = new Map();
            for (const path of Object.keys(group.items)) {
                const item = group.items[path];
                const normalizedPath = normalizeResourcePath(path);
                if (item.type === "folder") {
                    const folderKeys = item.keys || [];
                    for (const f of scanFolderRecursive(normalizedPath)) {
                        active.add(f);
                        activePaths.add(f);
                        // Inherit folder keys
                        if (!assetKeys.has(f)) assetKeys.set(f, new Set());
                        for (const k of folderKeys) {
                            assetKeys.get(f)!.add(k);
                        }
                        collectResourceDeps(f, passive, assetUids);
                    }
                } else {
                    active.add(normalizedPath);
                    activePaths.add(normalizedPath);
                    const itemUid = parseResourceRef(path).uid;
                    if (itemUid !== "") assetUids.set(normalizedPath, itemUid);
                    // Add file's own keys
                    if (!assetKeys.has(normalizedPath)) assetKeys.set(normalizedPath, new Set());
                    for (const k of (item.keys || [])) {
                        assetKeys.get(normalizedPath)!.add(k);
                    }
                    collectResourceDeps(normalizedPath, passive, assetUids);
                }
            }

            // Add or update group entry (merge if same name across packages)
            const existingGroup = allEasyAssetBundleInfos[groupName];
            if (existingGroup) {
                if (!existingGroup.packages.includes(pkgName)) {
                    existingGroup.packages.push(pkgName);
                }
                existingGroup.isEncrypt = existingGroup.isEncrypt || pkg.isEncrypt || group.isEncrypt;
                existingGroup.abDownloadPriority = Math.min(existingGroup.abDownloadPriority, pkg.downloadPriority);
            } else {
                allEasyAssetBundleInfos[groupName] = {
                    easyAssetBundleType: 0,
                    abName: groupName,
                    md5: "",
                    size: 0,
                    crc: 0,
                    packages: [pkgName],
                    location: 0,
                    isEncrypt: pkg.isEncrypt || group.isEncrypt,
                    abDownloadPriority: pkg.downloadPriority,
                };
            }

            // Add or update active asset entries with needGroup references and keys.
            for (const path of active) {
                const directDeps = collectDirectResourceDeps(path);
                const deps = directDeps.paths;
                const typeIndex = getResourceTypeIndex(path, assemblyQualifiedNames, warnings);
                for (const [depPath, uid] of directDeps.uids) {
                    if (!assetUids.has(depPath)) assetUids.set(depPath, uid);
                }

                const existing = allActiveEasyAssetInfos[path];
                const pathKeys = assetKeys.get(path);
                if (existing) {
                    if (!existing.needGroup.includes(groupName)) {
                        existing.needGroup.push(groupName);
                    }
                    const uid = assetUids.get(path);
                    if (uid != null && uid !== "" && existing.uid == null) existing.uid = uid;
                    if (typeIndex >= 0) existing.typeIndex = typeIndex;
                    // Merge keys from this path
                    if (pathKeys) {
                        for (const k of pathKeys) {
                            if (!existing.keys.includes(k)) {
                                existing.keys.push(k);
                            }
                        }
                    }
                } else {
                    allActiveEasyAssetInfos[path] = {
                        deps,
                        needGroup: [groupName],
                        keys: pathKeys ? Array.from(pathKeys) : [],
                        typeIndex,
                    };
                    const uid = assetUids.get(path);
                    if (uid != null && uid !== "") allActiveEasyAssetInfos[path].uid = uid;
                }
            }

            for (const path of passive) {
                const directDeps = collectDirectResourceDeps(path);
                const deps = directDeps.paths;
                const typeIndex = getResourceTypeIndex(path, assemblyQualifiedNames, warnings);
                for (const [depPath, uid] of directDeps.uids) {
                    if (!assetUids.has(depPath)) assetUids.set(depPath, uid);
                }
                const existing = allPassiveEasyAssetInfos[path];
                if (existing) {
                    if (!existing.needGroup.includes(groupName)) existing.needGroup.push(groupName);
                    const uid = assetUids.get(path);
                    if (uid != null && uid !== "" && existing.uid == null) existing.uid = uid;
                    if (typeIndex >= 0) existing.typeIndex = typeIndex;
                } else {
                    allPassiveEasyAssetInfos[path] = { deps, needGroup: [groupName], keys: [], typeIndex };
                    const uid = assetUids.get(path);
                    if (uid != null && uid !== "") allPassiveEasyAssetInfos[path].uid = uid;
                }
            }
        }
    }

    for (const path of Object.keys(allPassiveEasyAssetInfos)) {
        if (activePaths.has(path)) {
            const active = allActiveEasyAssetInfos[path];
            const passive = allPassiveEasyAssetInfos[path];
            if (active) {
                for (const groupName of passive.needGroup) {
                    if (!active.needGroup.includes(groupName)) active.needGroup.push(groupName);
                }
                if (active.uid == null && passive.uid != null) active.uid = passive.uid;
            }
            delete allPassiveEasyAssetInfos[path];
        }
    }

    return {
        version: Date.now(),
        versionCode: data.versionCode,
        packages,
        allEasyAssetBundleInfos,
        allActiveEasyAssetInfos,
        allPassiveEasyAssetInfos,
        assemblyQualifiedNames,
    };
}

export function exportCatalogsWithPcks(data: AssetDBData, outputDir: string = PCK_OUTPUT_DIR): PckExportResult {
    const normalizedOutputDir = normalizeOutputDir(outputDir);
    const exported: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const catalogs = exportCatalogs(data, warnings);

    if (!ensureDir(normalizedOutputDir)) {
        errors.push("Cannot create output dir: " + normalizedOutputDir);
        return { catalogs, outputDir: normalizedOutputDir, exported, warnings, errors };
    }

    for (const groupName of Object.keys(catalogs.allEasyAssetBundleInfos)) {
        const bundleInfo = catalogs.allEasyAssetBundleInfos[groupName];
        const tempPath = joinPath(normalizedOutputDir, safeFileName(groupName) + ".tmp.pck");
        const files = collectBundleFiles(catalogs, groupName);
        const packer = new PCKPacker();
        let ok = true;

        const startErr = packer.pck_start(tempPath);
        if (startErr !== OK) {
            errors.push("Failed to start pck: " + groupName + " error=" + startErr);
            continue;
        }

        const added = new Set<string>();
        for (const filePath of files) {
            if (!addPackedFile(packer, filePath, bundleInfo.isEncrypt, added, warnings)) {
                ok = false;
            }
        }

        const flushErr = packer.flush(false);
        if (flushErr !== OK) {
            errors.push("Failed to flush pck: " + groupName + " error=" + flushErr);
            ok = false;
        }
        if (!ok) continue;

        const md5 = FileAccess.get_md5(tempPath);
        if (md5 === "") {
            errors.push("Failed to calculate md5: " + tempPath);
            continue;
        }

        const finalPath = joinPath(normalizedOutputDir, md5 + ".pck");
        const outputAccess = DirAccess.open(normalizedOutputDir);
        if (outputAccess == null) {
            errors.push("Failed to open output dir: " + normalizedOutputDir);
            continue;
        }
        const finalFileName = md5 + ".pck";
        const tempFileName = safeFileName(groupName) + ".tmp.pck";
        if (FileAccess.file_exists(finalPath)) {
            outputAccess.remove(finalFileName);
        }
        const renameErr = outputAccess.rename(tempFileName, finalFileName);
        if (renameErr !== OK) {
            errors.push("Failed to rename pck: " + tempPath + " -> " + finalPath + " error=" + renameErr);
            continue;
        }

        bundleInfo.easyAssetBundleType = 0;
        bundleInfo.md5 = md5;
        bundleInfo.size = getFileSize(finalPath);
        bundleInfo.crc = calculateFileCrc32(finalPath);
        exported.push(finalPath);
    }

    return { catalogs, outputDir: normalizedOutputDir, exported, warnings, errors };
}
