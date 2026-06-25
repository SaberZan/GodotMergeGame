import { Control, Node, PackedScene, Resource } from "godot";
import { SingleGodotAssetHandle } from "../Assets/AssetHandle/SingleGodotAssetHandle";
import { AssetsMgr } from "../Assets/AssetsMgr";
import { IPoolObject, ObjectPoolMgr } from "../Pool/ObjectPoolMgr";
import { MessageMgr } from "../Message/MessageMgr";
import { UIMgr } from "./UIMgr";
import { SchedulerMgr, SchedulerObj } from "../Scheduler/SchedulerMgr";
import BaseAssetHandle from "../Assets/AssetHandle/BaseAssetHandle";

export class UIData implements IPoolObject {
    public static Get(): UIData {
        return ObjectPoolMgr.Instance().GetObject<UIData>(UIData);
    }

    public static Put(data: UIData) {
        ObjectPoolMgr.Instance().PutObject(UIData, data);
    }

    public objData: { [key: string]: any } = {};

    public Reset() {
        this.objData = {};
    }

    public SetField<T>(key: string, value: T) {
        this.objData[key] = value;
    }

    public GetField<T>(key: string): T | undefined {
        return this.objData[key];
    }
}

/// <summary>
/// UI状态枚举，用于标记UI组件的生命周期状态
/// </summary>

export enum UIState {
    None = 0,
    Awake = 1 << 1,
    Enable = 1 << 2,
    Disable = 1 << 3,
    Destroy = 1 << 4,
}

/// <summary>
/// 基础UI类，提供UI组件的基本功能和生命周期管理
/// </summary>
export class BaseUI {
    /// <summary>
    /// 当前UI的状态
    /// </summary>
    public uiState: UIState = UIState.None;

    /// <summary>
    /// 资源句柄，用于加载和释放资源
    /// </summary>
    public handle: SingleGodotAssetHandle<PackedScene<Node>> | undefined;

    /// <summary>
    /// 是否异步加载
    /// </summary>
    public loadAsync: boolean = false;

    /// <summary>
    /// 承接所有的gameobject
    /// </summary>
    public baseNode: Node | undefined;
    /// <summary>
    /// 关联的GameObject实例
    /// </summary>
    public node: Node | undefined;

    /// <summary>
    /// 子UI列表
    /// </summary>
    public subUIs: BaseUI[] = [];

    /// <summary>
    /// 临时子UI列表，用于批量操作
    /// </summary>
    public tmpSubUIs: BaseUI[] = [];

    /// <summary>
    /// 定时器对象列表，用于管理定时器
    /// </summary>
    public schedulerObjs: SchedulerObj[] = [];

    /// <summary>
    /// 资源句柄列表，用于管理所有加载的资源
    /// </summary>
    public handles: (BaseAssetHandle | undefined)[] = [];


    /// <summary>
    /// 数据接口，用于传递数据
    /// </summary>
    public dataInterface: UIData | undefined;

    public uiName: string = "";

    /// <summary>
    /// 获取UI名称，默认为类名
    /// </summary>
    /// <returns>UI名称</returns>
    public SetUIName(name: string) {
        this.uiName = name;
    }

    /// <summary>
    /// 获取UI名称，默认为类名
    /// </summary>
    /// <returns>UI名称</returns>
    public GetUIName(): string {
        return this.uiName;
    }

    /// <summary>
    /// 打开UI
    /// </summary>
    public Show() {
        this.Awake();
        this.Enable();
    }

    /// <summary>
    /// 关闭UI
    /// </summary>
    public Hide() {
        this.Awake();
        this.Disable();
    }

    /// <summary>
    /// 初始化UI组件，设置取消令牌并订阅事件
    /// </summary>
    public Awake() {
        if (this.GetUIState(UIState.Awake)) {
            return;
        }
        this.AddUIState(UIState.Awake);


        if (this.baseNode == undefined) {
            this.baseNode = new Control(this.GetUIName());
            UIMgr.Instance().AddFullScreenRectTransform(this.baseNode);
        }

        this.OnCreate();

        if (this.handle != null) {
            if (this.loadAsync) {
                var task = this.handle.InstantiateAsync();
                task.then((result) => {
                    this.node = <Node>result;
                    if (this.baseNode != undefined)
                        this.node?.reparent(this.baseNode, false);
                    this.OnStart();
                    if (this.GetUIState(UIState.Enable)) {
                        this.OnEnable();
                    }
                    if (this.GetUIState(UIState.Disable)) {
                        this.OnDisable();
                    }
                });
            }
            else {
                this.node = <Node>this.handle.Instantiate();
                this.OnStart();
            }
        }

        if (this.node != null) {
            this.node.reparent(this.baseNode, false);
            this.OnStart();
        }

        this.tmpSubUIs = [];
        this.tmpSubUIs.concat(this.subUIs);
        this.tmpSubUIs.forEach(subUI => {
            if (!subUI.GetUIState(UIState.Awake))
                subUI.Awake();
        });
    }


    /// <summary>
    /// 显示UI组件及其子UI
    /// </summary>
    /// <param name="callback">显示完成后的回调函数</param>
    public Enable() {
        if (!this.GetUIState(UIState.Awake)) {
            return;
        }
        if (this.GetUIState(UIState.Enable) && !this.GetUIState(UIState.Disable)) {
            return;
        }
        this.AddUIState(UIState.Enable);
        this.RemoveUIState(UIState.Disable);

        if (this.node != null) {
            this.OnEnable();
        }

        this.tmpSubUIs = [];
        this.tmpSubUIs.concat(this.subUIs);
        this.tmpSubUIs.forEach(subUI => subUI.Enable());
        // this.baseGameObject.SetActive(true);
    }

    /// <summary>
    /// 隐藏UI组件及其子UI
    /// </summary>
    /// <param name="callback">隐藏完成后的回调函数</param>
    public Disable() {
        if (!this.GetUIState(UIState.Awake)) {
            return;
        }
        if (this.GetUIState(UIState.Disable)) {
            return;
        }
        this.AddUIState(UIState.Disable);

        if (this.node != null) {
            this.OnDisable();
        }

        this.tmpSubUIs = [];
        this.tmpSubUIs.concat(this.subUIs);
        this.tmpSubUIs.forEach(subUI => subUI.Disable());
        // this.baseGameObject.SetActive(false); 
    }

    /// <summary>
    /// 更新UI组件及其子UI
    /// </summary>
    /// <param name="deltaTime">时间间隔</param>
    public Update(deltaTime: number) {
        if (this.GetUIState(UIState.Awake)) {
            this.tmpSubUIs = [];
            this.tmpSubUIs.concat(this.subUIs);
            this.tmpSubUIs.forEach(subUI => subUI.Update(deltaTime));
        }

        this.OnUpdate(deltaTime);
    }

    /// <summary>
    /// 销毁UI组件及其子UI
    /// </summary>
    public Destroy() {
        if (!this.GetUIState(UIState.Awake)) {
            return;
        }
        if (this.GetUIState(UIState.Destroy)) {
            return;
        }
        this.AddUIState(UIState.Destroy);


        SchedulerMgr.Instance().ClearByObj(this);
        this.schedulerObjs = [];


        this.tmpSubUIs = [];
        this.tmpSubUIs.concat(this.subUIs);
        this.tmpSubUIs.forEach(subUI => subUI.Destroy());
        this.subUIs = [];

        MessageMgr.Instance().OffByTarget(this);

        for (var handle of this.handles) {
            if (handle)
                AssetsMgr.Instance().Release(handle);
        }
        this.handles = [];

        if (this.handle != undefined) {
            if (this.node != undefined) {
                this.OnDestroy();
                this.handle.ReleaseInstance(this.node);
                this.node = undefined;
            }
            AssetsMgr.Instance().Release(this.handle);
        }
        else {
            if (this.node != null) {
                this.OnDestroy();
                this.node.queue_free()
                this.node = undefined;
            }
        }

        this.baseNode?.queue_free();

        if (this.dataInterface != undefined) {
            UIData.Put(this.dataInterface);
            this.dataInterface = undefined;
        }
    }

    /// <summary>
    /// 设置预制体路径，用于实例化UI
    /// </summary>
    /// <param name="path">预制体路径</param>
    public SetPrefabPath(path: string, async: boolean = false) {
        if (this.node != null) {
            // throw new Exception("UI错误：不能在已有GameObject的情况下设置预制体路径");
            return;
        }
        this.handle = AssetsMgr.Instance().LoadAsset<PackedScene<Node>>(path, PackedScene<Node>);
        this.loadAsync = async;
    }

    /// <summary>
    /// 设置现有的GameObject作为UI的根对象
    /// </summary>
    /// <param name="gObj">现有的GameObject</param>
    public SetGameObject(gObj: Node) {
        if (this.handle != null) {
            // throw new System.Exception("UI错误：不能在已有资源句柄的情况下设置GameObject");
            return;
        }
        this.node = gObj;
    }

    /// <summary>
    /// 设置数据接口
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="dataInterface"></param>
    public SetUIDataInterface(dataInterface: UIData) {
        this.dataInterface = dataInterface;
    }

    /// <summary>
    /// 添加子UI
    /// </summary>
    /// <param name="subUI">子UI实例</param>
    public AddSubUI(subUI: BaseUI) {
        if(this.subUIs.includes(subUI)) {
            return;
        }

        this.subUIs.push(subUI);
        if (this.GetUIState(UIState.Awake)) {
            if (!subUI.GetUIState(UIState.Awake)) {
                subUI.Awake();
            }
        }

        if (this.GetUIState(UIState.Enable)) {
            if (subUI.GetUIState(UIState.Awake) && !subUI.GetUIState(UIState.Enable)) {
                subUI.Enable();
            }
        }

        if (this.GetUIState(UIState.Disable)) {
            if (subUI.GetUIState(UIState.Awake) && !subUI.GetUIState(UIState.Disable)) {
                subUI.Disable();
            }
        }

        if (this.GetUIState(UIState.Destroy)) {
            if (subUI.GetUIState(UIState.Awake) && !subUI.GetUIState(UIState.Destroy)) {
                subUI.Destroy();
            }
        }
    }

    /// <summary>
    /// 移除子UI
    /// </summary>
    /// <param name="subUI">要移除的子UI实例</param>
    public RemoveSubUI(subUI: BaseUI) {
        let index = this.subUIs.indexOf(subUI)
        if (index != -1) {
            if (subUI.GetUIState(UIState.Awake) && !subUI.GetUIState(UIState.Destroy)) {
                subUI.Destroy();
            }
            this.subUIs.splice(index, 1);
        }
    }

    /// <summary>
    /// 刚开始创建
    /// </summary>
    public OnCreate() {

    }

    /// <summary>
    /// 添加实例节点后调用
    /// </summary>
    public OnStart() {

    }

    /// <summary>
    /// 有实例节点后进前台调用
    /// </summary>
    public OnEnable() {

    }

    /// <summary>
    /// 有实例节点后进后台调用
    /// </summary>
    public OnDisable() {

    }

    /// <summary>
    /// 有实例节点后销毁调用
    /// </summary>
    public OnDestroy() {

    }

    /// <summary>
    /// tick
    /// </summary>
    public OnUpdate(deltaTime: number) {

    }

    /// <summary>
    /// 添加UI状态
    /// </summary>
    /// <param name="state">要添加的状态</param>
    public AddUIState(state: UIState) {
        if ((this.uiState & state) == UIState.None) {
            this.uiState |= state;
        }
    }

    /// <summary>
    /// 移除UI状态
    /// </summary>
    /// <param name="state">要移除的状态</param>
    public RemoveUIState(state: UIState) {
        if ((this.uiState & state) != UIState.None) {
            this.uiState &= ~state;
        }
    }

    /// <summary>
    /// 检查UI是否处于指定状态
    /// </summary>
    /// <param name="state">要检查的状态</param>
    /// <returns>是否处于指定状态</returns>
    public GetUIState(state: UIState): boolean {
        return (this.uiState & state) != UIState.None;
    }


    /// <summary>
    /// 注册定时器
    /// </summary>
    /// <param name="schedulerCallBack">定时器回调函数</param>
    /// <param name="args">回调参数</param>
    /// <param name="priority">优先级</param>
    /// <param name="afterTime">延迟时间（秒）</param>
    /// <param name="loop">循环次数（0表示无限循环）</param>
    /// <param name="loopInterval">循环间隔（秒）</param>
    public RegisterScheduler(schedulerCallBack: Function, args: any[], priority: number = 1, tickTime: number = 0, loop: number = 0, loopInterval: number = 1) {
        this.schedulerObjs.push(SchedulerMgr.Instance().Register(this, schedulerCallBack, args, priority, tickTime, loop, loopInterval));
    }

    /// <summary>
    /// 反注册定时器
    /// </summary>
    /// <param name="schedulerCallBack"></param>
    public UnregisterScheduler(schedulerCallBack: Function) {
        for (let i = this.schedulerObjs.length - 1; i >= 0; --i) {
            if (this.schedulerObjs[i].callback == schedulerCallBack) {
                SchedulerMgr.Instance().Remove(this.schedulerObjs[i]);
                this.schedulerObjs.splice(i, 1);
            }
        }
    }

    /// <summary>
    /// 加载单个资源
    /// </summary>
    /// <param name="path">资源路径</param>
    /// <returns>资源句柄</returns>
    public LoadAsset(path: string): BaseAssetHandle | undefined {
        let handle = AssetsMgr.Instance().LoadAsset<Resource>(path, Resource);
        this.handles.push(handle);
        return handle;
    }

    /// <summary>
    /// 加载多个资源
    /// </summary>
    /// <param name="paths">资源路径列表</param>
    /// <returns>资源句柄</returns>
    public LoadAssets(paths: string[]): BaseAssetHandle | undefined {
        let handle = AssetsMgr.Instance().LoadAssetsByPaths<Resource>(paths, Resource);
        this.handles.push(handle);
        return handle;
    }

    /// <summary>
    /// 加载单个原始资源
    /// </summary>
    /// <param name="path">资源路径</param>
    /// <returns>资源句柄</returns>
    public LoadRawAsset(path: string): BaseAssetHandle | undefined {
        let handle = AssetsMgr.Instance().LoadRawAsset(path);
        this.handles.push(handle);
        return handle;
    }

    /// <summary>
    /// 加载多个原始资源
    /// </summary>
    /// <param name="paths">资源路径列表</param>
    /// <returns>资源句柄</returns>
    public LoadRawAssets(paths: string[]): BaseAssetHandle | undefined {
        let handle = AssetsMgr.Instance().LoadRawAssetsByPaths(paths);
        this.handles.push(handle);
        return handle;
    }
}
