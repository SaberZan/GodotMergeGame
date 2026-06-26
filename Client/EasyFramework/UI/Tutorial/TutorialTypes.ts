// 新手引导框架类型定义

/**
 * 引导步骤类型枚举
 */
export enum TutorialStepType {
  /** 文字提示步骤 */
  TEXT = 1,
  /** 点击交互步骤 */
  CLICK = 2,
  /** 拖拽交互步骤 */
  DRAG = 3,
  /** 滚轮交互步骤 */
  SCROLL = 4,
  /** 菜单选择步骤 */
  MENU_SELECT = 5,
  /** 等待步骤 */
  WAIT = 6,
  /** 自定义步骤 */
  CUSTOM = 7
}

/**
 * 引导步骤数据接口
 */
export interface TutorialStepData {
  /** 步骤唯一标识 */
  id: string;
  /** 步骤类型 */
  type: TutorialStepType;
  /** 步骤标题 */
  title?: string;
  /** 步骤描述 */
  description: string;
  /** 目标节点路径（可选） */
  targetPath?: string;
  /** 目标节点名称（可选） */
  targetName?: string;
  /** 是否强制完成 */
  required: boolean;
  /** 延迟时间（毫秒） */
  delay?: number;
  /** 停止条件回调 */
  stopCondition?: () => boolean;
  /** 完成回调 */
  onComplete?: () => void;
  /** 点击目标回调 */
  onClick?: (node: any) => void;
  /** 拖拽回调 */
  onDrag?: (node: any) => void;
  /** 滚轮回调 */
  onScroll?: (node: any) => void;
  /** 自定义数据 */
  customData?: any;
}

/**
 * 引导配置接口
 */
export interface TutorialConfig {
  /** 引导唯一标识 */
  id: string;
  /** 引导名称 */
  name: string;
  /** 引导描述 */
  description?: string;
  /** 引导步骤列表 */
  steps: TutorialStepData[];
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** 最大重试次数 */
  maxRetry?: number;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否显示进度指示器 */
  showProgressIndicator?: boolean;
  /** 是否允许跳过 */
  allowSkip?: boolean;
  /** 跳过按钮文本 */
  skipButtonText?: string;
  /** 完成按钮文本 */
  completeButtonText?: string;
  /** 提示框位置 */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** 提示框样式配置 */
  tooltipStyle?: {
    /** 背景颜色 */
    backgroundColor?: string;
    /** 文字颜色 */
    textColor?: string;
    /** 边框颜色 */
    borderColor?: string;
    /** 圆角大小 */
    borderRadius?: number;
    /** 最大宽度 */
    maxWidth?: number;
  };
}

/**
 * 引导状态枚举
 */
export enum TutorialState {
  /** 未开始 */
  IDLE = 0,
  /** 进行中 */
  IN_PROGRESS = 1,
  /** 已完成 */
  COMPLETED = 2,
  /** 已跳过 */
  SKIPPED = 3,
  /** 已停止 */
  STOPPED = 4
}

/**
 * 引导事件类型
 */
export enum TutorialEventType {
  /** 引导开始 */
  START = 'tutorial_start',
  /** 引导结束 */
  END = 'tutorial_end',
  /** 步骤开始 */
  STEP_START = 'tutorial_step_start',
  /** 步骤完成 */
  STEP_COMPLETE = 'tutorial_step_complete',
  /** 步骤跳过 */
  STEP_SKIP = 'tutorial_step_skip',
  /** 引导跳过 */
  TUTORIAL_SKIP = 'tutorial_skip',
  /** 引导完成 */
  TUTORIAL_COMPLETE = 'tutorial_complete'
}

/**
 * 引导事件数据接口
 */
export interface TutorialEventData {
  /** 事件类型 */
  type: TutorialEventType;
  /** 引导 ID */
  tutorialId: string;
  /** 步骤 ID（可选） */
  stepId?: string;
  /** 事件数据 */
  data?: any;
}

/**
 * 引导进度数据接口
 */
export interface TutorialProgress {
  /** 引导 ID */
  tutorialId: string;
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 已完成步骤数 */
  completedStepCount: number;
  /** 总步骤数 */
  totalStepCount: number;
  /** 是否已完成 */
  isCompleted: boolean;
  /** 是否已跳过 */
  isSkipped: boolean;
  /** 重试次数 */
  retryCount: number;
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/**
 * 引导配置接口扩展
 */
export interface TutorialConfigWithProgress extends TutorialConfig {
  /** 进度数据 */
  progress?: TutorialProgress;
}
