/**
 * TutorialLayer 使用示例
 * 展示如何使用新的 UI 层式引导系统
 */

import { MessageMgr } from "../../Message/MessageMgr";
import { TutorialLayer } from "./TutorialLayer";
import { TutorialStepType, TutorialEventType } from "./TutorialTypes";

/**
 * 示例：初始化引导系统
 * 在 UI 初始化时调用
 */
export function InitTutorialSystem(): void {
  // 创建 TutorialLayer
  const tutorialLayer = new TutorialLayer();
  tutorialLayer.SetResPath("res://Assets/UI/TutorialLayer.tscn");
  tutorialLayer.Awake();
  tutorialLayer.Hide();
  
  // 在 UI 管理器中注册
  // UIMgr.Instance().AddLayer(tutorialLayer);
}

/**
 * 示例：注册引导配置
 */
export function RegisterTutorials(layer: TutorialLayer): void {
  // 注册新手引导
  layer.RegisterTutorial({
    id: "newbie_guide",
    name: "新手引导",
    description: "引导玩家了解游戏基本操作",
    steps: [
      {
        id: "welcome",
        type: TutorialStepType.TEXT,
        title: "欢迎",
        description: "欢迎来到游戏世界！",
        required: true,
        delay: 1000
      },
      {
        id: "click_button",
        type: TutorialStepType.CLICK,
        title: "点击按钮",
        description: "请点击屏幕中央的按钮",
        required: true,
        targetName: "Button_Start"
      },
      {
        id: "drag_item",
        type: TutorialStepType.DRAG,
        title: "拖拽物品",
        description: "请将物品拖拽到指定位置",
        required: true
      },
      {
        id: "complete",
        type: TutorialStepType.TEXT,
        title: "引导完成",
        description: "恭喜！你已经掌握了基本操作。",
        required: true
      }
    ],
    autoStart: false,
    allowSkip: true,
    showProgressIndicator: true
  });

  // 注册功能引导
  layer.RegisterTutorial({
    id: "feature_guide",
    name: "功能引导",
    description: "引导玩家了解游戏特色功能",
    steps: [
      {
        id: "menu_intro",
        type: TutorialStepType.MENU_SELECT,
        title: "菜单介绍",
        description: "请从菜单中选择一个选项",
        required: true,
        targetName: "Menu_Options"
      },
      {
        id: "scroll_view",
        type: TutorialStepType.SCROLL,
        title: "滚动查看",
        description: "请滚动列表查看更多内容",
        required: true,
        targetName: "ScrollView"
      },
      {
        id: "wait_moment",
        type: TutorialStepType.WAIT,
        title: "请稍候",
        description: "正在加载...",
        delay: 3000,
        required: true
      }
    ],
    autoStart: false,
    allowSkip: true
  });
}

/**
 * 示例：显示引导（在 UI 中）
 */
export function ShowTutorial(layer: TutorialLayer, tutorialId: string): void {
  if (layer.StartTutorial(tutorialId)) {
    console.log(`Started tutorial: ${tutorialId}`);
  } else {
    console.error(`Failed to start tutorial: ${tutorialId}`);
  }
}

/**
 * 示例：订阅引导事件
 */
export function SubscribeTutorialEvents(layer: TutorialLayer): void {

  // 监听引导开始事件
  MessageMgr.Instance().On(
    TutorialEventType.START,  
    null,
    (data : any) => {
      console.log(`Tutorial started: ${data.tutorialId}`);
      // 可以在这里显示引导 UI
    }
  );

  // 监听步骤完成事件
  MessageMgr.Instance().On(
    TutorialEventType.STEP_COMPLETE, 
    null,
    (data : any) => {
      console.log(`Step completed: ${data.stepId}`);
    }
  );

  // 监听引导完成事件
  MessageMgr.Instance().On(
    TutorialEventType.TUTORIAL_COMPLETE,
    null,
    (data : any) => {
      console.log(`Tutorial completed: ${data.tutorialId}`);
      // 可以在这里发放奖励或隐藏 UI
    }
  );
}

/**
 * 示例：创建快速文字引导
 */
export function CreateQuickTextGuide(layer: TutorialLayer): void {
  const config = layer.CreateQuickTutorial(
    "quick_guide",
    "快速引导",
    [
      { title: "第一步", description: "这是第一步说明", delay: 2000 },
      { title: "第二步", description: "这是第二步说明", delay: 2000 },
      { title: "第三步", description: "这是第三步说明", delay: 2000 }
    ]
  );

  layer.RegisterTutorial(config);
  layer.StartTutorial("quick_guide");
}

/**
 * 示例：检查并开始未完成的引导
 */
export function CheckAndResumeTutorial(layer: TutorialLayer): void {
  // 检查新手引导是否已完成
  if (!layer.IsTutorialCompleted("newbie_guide")) {
    // 获取进度
    const progress = layer.GetTutorialProgress("newbie_guide");
    
    if (progress && progress.currentStepIndex > 0) {
      console.log(`Resuming tutorial from step ${progress.currentStepIndex}`);
    }
    
    layer.StartTutorial("newbie_guide");
  }
}

/**
 * 示例：每帧更新（在游戏主循环中调用）
 */
export function UpdateTutorial(layer: TutorialLayer, deltaTime: number): void {
  if (layer.HasActiveTutorial()) {
    // 可以在这里添加 UI 更新逻辑
  }
}

/**
 * 示例：清理资源
 */
export function CleanupTutorial(layer: TutorialLayer): void {
  // 停止当前引导
  if (layer.HasActiveTutorial()) {
    const current = layer.GetCurrentTutorial();
    if (current) {
      current.Stop();
    }
  }
  
  // 清理所有引导
  const tutorialIds = layer.GetRegisteredTutorialIds();
  for (const id of tutorialIds) {
    layer.StopTutorial(id);
  }
  
  // 销毁层
  layer.Destroy();
}
