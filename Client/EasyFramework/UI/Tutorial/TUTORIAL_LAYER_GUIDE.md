# TutorialLayer 使用指南

## 概述

TutorialLayer 是一个 UI 层，负责显示和管理新手引导。它继承自 BaseUILayer，具有完整的生命周期管理功能。

## 特性

- **UI 层式设计**：继承 BaseUILayer，具有完整的显示/隐藏/更新生命周期
- **引导管理**：注册、启动、停止、跳过引导
- **事件系统**：支持引导开始、完成、步骤完成等事件
- **向后兼容**：保留 TutorialMgr 作为兼容层

## 架构

```
TutorialLayer (UI 层)
├── TutorialGuide (引导控制器)
│   └── TutorialStep[] (步骤实例)
└── TutorialGuideUI (UI 显示)
```

## 快速开始

### 1. 初始化

```typescript
import { TutorialLayer } from "./Tutorial";

// 创建 TutorialLayer
const tutorialLayer = new TutorialLayer();
tutorialLayer.SetPrefabPath("res://Assets/UI/TutorialLayer.tscn");
tutorialLayer.Awake();
tutorialLayer.Hide();
```

### 2. 注册引导

```typescript
import { TutorialStepType } from "./Tutorial";

// 注册引导配置
tutorialLayer.RegisterTutorial({
  id: "newbie_guide",
  name: "新手引导",
  description: "游戏基础操作引导",
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
      description: "请点击开始按钮",
      targetName: "Button_Start",
      required: true
    }
  ],
  autoStart: false,
  allowSkip: true,
  showProgressIndicator: true
});
```

### 3. 启动引导

```typescript
// 启动指定引导
tutorialLayer.StartTutorial("newbie_guide");
```

### 4. 监听事件

```typescript
import { TutorialEventType } from "./Tutorial";

// 监听引导完成事件
MessageMgr.Instance().Subscribe(
  TutorialEventType.TUTORIAL_COMPLETE,
  (data) => {
    console.log(`引导完成: ${data.tutorialId}`);
    // 发放奖励
  }
);
```

## API 参考

### TutorialLayer 方法

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `RegisterTutorial(config)` | 注册引导配置 | `TutorialConfig` | `void` |
| `RegisterTutorials(configs)` | 批量注册引导 | `TutorialConfig[]` | `void` |
| `StartTutorial(id)` | 启动引导 | `string` | `boolean` |
| `StopTutorial(id)` | 停止引导 | `string` | `void` |
| `SkipCurrentStep()` | 跳过当前步骤 | - | `boolean` |
| `SkipTutorial()` | 跳过整个引导 | - | `boolean` |
| `PauseTutorial()` | 暂停引导 | - | `void` |
| `ResumeTutorial()` | 恢复引导 | - | `void` |
| `GetTutorialState(id)` | 获取引导状态 | `string` | `TutorialState \| null` |
| `IsTutorialCompleted(id)` | 检查是否已完成 | `string` | `boolean` |
| `GetCurrentTutorial()` | 获取当前引导 | - | `TutorialGuide \| null` |
| `GetTutorialProgress(id)` | 获取进度 | `string` | `TutorialProgress \| null` |
| `CreateQuickTutorial(id, name, steps)` | 创建快速引导 | `string, string, {desc}[]` | `TutorialConfig` |
| `HasActiveTutorial()` | 检查是否有活动引导 | - | `boolean` |
| `GetRegisteredTutorialIds()` | 获取已注册引导ID | - | `string[]` |

## 与 TutorialMgr 的区别

### TutorialLayer（推荐）

```typescript
const layer = new TutorialLayer();
layer.RegisterTutorial(config);
layer.StartTutorial("guide_1");
```

**优点**：
- UI 层式设计，生命周期清晰
- 可以像其他 UI 层一样管理
- 支持显示/隐藏控制
- 更符合 UI 架构

### TutorialMgr（兼容层）

```typescript
const mgr = TutorialMgr.Instance();
mgr.RegisterTutorial(config);
mgr.StartTutorial("guide_1");
```

**优点**：
- 向后兼容，现有代码无需修改
- 单例模式，全局访问方便

**缺点**：
- 单例模式，不灵活
- 不是真正的 UI 层

## 迁移指南

### 从 TutorialMgr 迁移到 TutorialLayer

**旧代码：**
```typescript
import { TutorialMgr } from "./Tutorial";

await TutorialMgr.Instance().Init();
TutorialMgr.Instance().RegisterTutorial(config);
TutorialMgr.Instance().StartTutorial("guide_1");
```

**新代码：**
```typescript
import { TutorialLayer } from "./Tutorial";

const layer = new TutorialLayer();
layer.RegisterTutorial(config);
layer.StartTutorial("guide_1");
```

## 最佳实践

1. **在 UI 初始化时创建 TutorialLayer**
   ```typescript
   public OnInit() {
     this.tutorialLayer = new TutorialLayer();
     this.tutorialLayer.SetPrefabPath("res://Assets/UI/TutorialLayer.tscn");
     this.tutorialLayer.Awake();
     this.tutorialLayer.Hide();
   }
   ```

2. **使用快速引导简化开发**
   ```typescript
   const config = layer.CreateQuickTutorial(
     "quick_guide",
     "快速引导",
     [
       { title: "步骤1", description: "说明内容", delay: 2000 }
     ]
   );
   ```

3. **监听事件处理业务逻辑**
   ```typescript
   MessageMgr.Instance().Subscribe(
     TutorialEventType.TUTORIAL_COMPLETE,
    (data) => {
      // 发放奖励
    }
   );
   ```

4. **检查引导状态**
   ```typescript
   if (layer.IsTutorialCompleted("guide_1")) {
     // 已完成，可以隐藏 UI 或发放奖励
   }
   ```

## 事件类型

| 事件类型 | 说明 |
|---------|------|
| `START` | 引导开始 |
| `END` | 引导结束 |
| `STEP_START` | 步骤开始 |
| `STEP_COMPLETE` | 步骤完成 |
| `STEP_SKIP` | 步骤跳过 |
| `TUTORIAL_SKIP` | 引导跳过 |
| `TUTORIAL_COMPLETE` | 引导完成 |

## 完整示例

参见 [TutorialLayerExample.ts](./TutorialLayerExample.ts)
