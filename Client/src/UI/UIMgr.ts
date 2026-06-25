import { Control, Node, PackedScene } from "godot";
import { Singleton } from "../Utils/Singleton";
import { BaseUILayer } from "./BaseUILayer";
import { AssetsMgr } from "../Assets/AssetsMgr";
import App from "../App";

export enum LayerType {
    NORMAL_STATIC,
    NORMAL_DYNAMIC,
    DIALOG,
    ABOVE_DIALOG,
    TOP_LAYER,
    TUTORIAL
}
export enum DialogType {
    NORMAL,
    LOW_PRIORITY,
    SECONDARY,  //二级弹窗
}

export class UIMgr extends Singleton<UIMgr> {

    private uiRoot: Node | null = null;

    private staticUI: Node | null = null;

    private dynamicUI: Node | null = null;

    private dialogUI: Node | null = null;

    private toastUI: Node | null = null;

    private tutorialUI: Node | null = null;

    private loadingUI: Node | null = null;

    private layers: { [key: string]: BaseUILayer } = {};

    public async Init(): Promise<boolean> {
        this.layers = {};

        let rootHandle = AssetsMgr.Instance().LoadAsset<PackedScene>("res://Assets/UI/UIRoot.tscn", PackedScene);
        if (rootHandle) {
            this.uiRoot = await rootHandle.InstantiateAsync() as Control;
            if (this.uiRoot != null) {
                App.node.add_child(this.uiRoot);
                this.AddFullScreenRectTransform(this.uiRoot);
            }

            let layerHandle = AssetsMgr.Instance().LoadAsset<PackedScene>("res://Assets/UI/Layer.tscn", PackedScene);
            if (layerHandle) {
                console.log("--------layerHandle----------");

                console.log("--------layerHandle---------- staticUI");
                this.staticUI = (await layerHandle.InstantiateAsync() as Control);
                this.staticUI.set_name("StaticUI");
                this.uiRoot.add_child(this.staticUI);
                this.AddFullScreenRectTransform(this.staticUI);

                console.log("--------layerHandle---------- dynamicUI");
                this.dynamicUI = (await layerHandle.InstantiateAsync() as Control);
                this.dynamicUI.set_name("DynamicUI");
                this.uiRoot.add_child(this.dynamicUI);
                this.AddFullScreenRectTransform(this.dynamicUI);

                console.log("--------layerHandle---------- dialogUI");
                this.dialogUI = (await layerHandle.InstantiateAsync() as Control);
                this.dialogUI.set_name("DialogUI");
                this.uiRoot.add_child(this.dialogUI);
                this.AddFullScreenRectTransform(this.dialogUI);

                console.log("--------layerHandle---------- toastUI");
                this.toastUI = (await layerHandle.InstantiateAsync() as Control);
                this.toastUI.set_name("ToastUI");
                this.uiRoot.add_child(this.toastUI);
                this.AddFullScreenRectTransform(this.toastUI);

                console.log("--------layerHandle---------- tutorialUI");
                this.tutorialUI = (await layerHandle.InstantiateAsync() as Control);
                this.tutorialUI.set_name("TutorialUI");
                this.uiRoot.add_child(this.tutorialUI);
                this.AddFullScreenRectTransform(this.tutorialUI);

                console.log("--------layerHandle---------- loadingUI");
                this.loadingUI = (await layerHandle.InstantiateAsync() as Control);
                this.loadingUI.set_name("LoadingUI");
                this.uiRoot.add_child(this.loadingUI);
                this.AddFullScreenRectTransform(this.loadingUI);
            }
        }
        return true;
    }

    public AddFullScreenRectTransform(rect: Node, safeAreaComponent: boolean = false) {
        if (rect instanceof Control) {
            rect.set_anchors_preset(Control.LayoutPreset.PRESET_FULL_RECT);
            rect.set_offsets_preset(Control.LayoutPreset.PRESET_FULL_RECT);
        }
        // if (safeAreaComponent) rect.gameObject.AddComponent<UISafeAreaLayout>();
        return rect;
    }

    /// <summary>
    /// 根据类型返回层根节点
    /// </summary>
    /// <param name="layerType"></param>
    /// <returns></returns>
    private SeekLayerNodeByType(layerType: LayerType = LayerType.NORMAL_STATIC): Node | null {
        switch (layerType) {
            case LayerType.NORMAL_STATIC: return this.staticUI;
            case LayerType.NORMAL_DYNAMIC: return this.dynamicUI;
            case LayerType.DIALOG: return this.dialogUI;
            default: return null;
        }
    }

    /// <summary>
    /// 屏蔽所有触摸
    /// </summary>
    public StopTouches() {
        // if (this.eventSystem != null) this.eventSystem.gameObject.SetActive(false);
    }
    /// <summary>
    /// 恢复触摸
    /// </summary>
    public ResumeTouches() {
        // if (this.eventSystem != null) this.eventSystem.gameObject.SetActive(true);
    }

    /// <summary>
    /// 添加层
    /// </summary>
    public AddLayer(baseUILayer: BaseUILayer) {
        baseUILayer.Awake();
        if (baseUILayer.node == null) {
            throw new Error("Start 中需要完成 node的初始化");
        }
        let layerName = baseUILayer.GetLayerName() || baseUILayer.constructor.name;
        this.layers[layerName] = baseUILayer;
        let parent = this.SeekLayerNodeByType(baseUILayer.GetLayerType());
        if (parent)
            baseUILayer.node.reparent(parent, false);
        this.AddFullScreenRectTransform(baseUILayer.node);
    }

    /// <summary>
    /// 添加层
    /// </summary>
    public RemoveLayer(layerName: string) {
        if (this.layers[layerName]) {
            this.layers[layerName].Destroy();
            delete this.layers[layerName];
        }
    }

    /// <summary>
    /// 添加层
    /// </summary>
    public RemoveAllLayer() {
        for (let layerName in this.layers) {
            this.layers[layerName].Destroy();
        }
        this.layers = {};
    }

    /// <summary>
    /// 显示Layer
    /// </summary>
    /// <param name="layer"></param>
    /// <param name="layerType"></param>
    public ShowLayer(layerName: string) {
        if (this.layers[layerName]) {
            this.layers[layerName].Show();
        }
    }

    /// <summary>
    /// 隐藏Layer
    /// </summary>
    /// <param name="layer"></param>
    /// <param name="layerType"></param>
    public HideLayer(layerName: string) {
        if (this.layers[layerName]) {
            this.layers[layerName].Hide();
        }
    }

    /// <summary>
    /// 显示全部Layer - 与HideAllLayer配合使用
    /// </summary>
    /// <param name="layerType"></param>
    public ShowAllLayer() {
        for (let layerName in this.layers) {
            this.layers[layerName].Show();
        }
    }

    /// <summary>
    /// 隐藏全部Layer - 与ShowAllLayer配合使用
    /// </summary>
    /// <param name="layerType"></param>
    public HideAllLayer() {
        for (let layerName in this.layers) {
            this.layers[layerName].Hide();
        }
    }


    /// <summary>
    /// 显示全部Layer - 与HideAllLayer配合使用
    /// </summary>
    /// <param name="layerType"></param>
    public GetLayer<T extends BaseUILayer>(layerName: string) {
        return <T>this.layers[layerName];
    }

    /// <summary>
    /// 获取类名
    /// </summary>
    public GetName<T extends { new(...args: any[]): {} }>(ctor: T): string {
        return ctor.name; // 使用类的构造函数名称
    }
}
