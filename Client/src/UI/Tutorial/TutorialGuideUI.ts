import { BaseUI } from "../BaseUI";
import { TutorialStepData, TutorialStepType, TutorialConfig } from "./TutorialTypes";
import { Node2D, Control, Button, Label, RichTextLabel, ColorRect, Vector2, Color, Callable } from "godot";

/**
 * 引导 UI 层
 * 负责显示引导提示、高亮目标、遮罩等视觉效果
 */
export class TutorialGuideUI extends BaseUI {
  /** 引导容器 */
  private container: Node2D | null = null;
  
  /** 遮罩层 */
  private maskLayer: ColorRect | null = null;
  
  /** 高亮遮罩 */
  private highlightMask: ColorRect | null = null;
  
  /** 提示框容器 */
  private tooltipContainer: Control | null = null;
  
  /** 提示标题 */
  private tooltipTitle: Label | null = null;
  
  /** 提示内容 */
  private tooltipContent: RichTextLabel | null = null;
  
  /** 下一步按钮 */
  private nextButton: Button | null = null;
  
  /** 跳过按钮 */
  private skipButton: Button | null = null;
  
  /** 进度指示器 */
  private progressIndicator: Label | null = null;
  
  /** 当前配置 */
  private currentConfig: TutorialConfig | null = null;
  
  /** 当前步骤数据 */
  private currentStepData: TutorialStepData | null = null;
  
  /** 下一步回调 */
  private onNextCallback: (() => void) | null = null;
  
  /** 跳过回调 */
  private onSkipCallback: (() => void) | null = null;

  constructor() {
    super();
    this.SetUIName("TutorialGuideUI");
  }

  /**
   * 初始化 UI
   */
  public OnCreate(): void {
    this.createUI();
  }

  /**
   * 创建 UI 元素
   */
  private createUI(): void {
    // 创建容器
    this.container = new Node2D("TutorialContainer");
    if (this.baseNode) {
      this.container.reparent(this.baseNode);
    }

    // 创建全屏遮罩层
    this.createMaskLayer();
    
    // 创建提示框
    this.createTooltip();
    
    // 创建进度指示器
    this.createProgressIndicator();
  }

  /**
   * 创建遮罩层
   */
  private createMaskLayer(): void {
    if (!this.container) return;

    // 创建半透明黑色遮罩
    this.maskLayer = new ColorRect();
    this.maskLayer.set_name("MaskLayer");
    this.maskLayer.set_anchor_and_offset(0, 0, 0);
    this.maskLayer.set_anchor_and_offset(1, 1, 0);
    this.maskLayer.set_anchor_and_offset(2, 1, 0);
    this.maskLayer.set_anchor_and_offset(3, 0, 0);
    this.maskLayer.color = new Color(0, 0, 0, 0.7);
    this.maskLayer.mouse_filter = Control.MouseFilter.MOUSE_FILTER_STOP;
    this.maskLayer.reparent(this.container);
  }

  /**
   * 创建提示框
   */
  private createTooltip(): void {
    if (!this.container) return;

    // 提示框容器
    this.tooltipContainer = new Control();
    this.tooltipContainer.set_name("TooltipContainer");
    this.tooltipContainer.reparent(this.container);

    // 背景
    const background = new ColorRect();
    background.set_name("Background");
    background.color = new Color(0.15, 0.15, 0.18, 0.95);
    background.custom_minimum_size = new Vector2(300, 0);
    background.reparent(this.tooltipContainer);

    // 标题
    this.tooltipTitle = new Label();
    this.tooltipTitle.set_name("Title");
    this.tooltipTitle.add_theme_font_size_override("font_size", 18);
    this.tooltipTitle.add_theme_color_override("font_color", new Color(1, 0.85, 0.3));
    this.tooltipTitle.reparent(this.tooltipContainer);

    // 内容
    this.tooltipContent = new RichTextLabel();
    this.tooltipContent.set_name("Content");
    this.tooltipContent.bbcode_enabled = true;
    this.tooltipContent.fit_content = true;
    this.tooltipContent.scroll_active = false;
    this.tooltipContent.add_theme_font_size_override("normal_font_size", 14);
    this.tooltipContent.reparent(this.tooltipContainer);

    // 下一步按钮
    this.nextButton = new Button();
    this.nextButton.set_name("NextButton");
    this.nextButton.text = "下一步";
    this.nextButton.reparent(this.tooltipContainer);
    this.nextButton.connect("pressed", Callable.create(this.onNextButtonPressed));

    // 跳过按钮
    this.skipButton = new Button();
    this.skipButton.set_name("SkipButton");
    this.skipButton.text = "跳过";
    this.skipButton.reparent(this.tooltipContainer);
    this.skipButton.connect("pressed", Callable.create(this.onSkipButtonPressed));
  }

  /**
   * 创建进度指示器
   */
  private createProgressIndicator(): void {
    if (!this.container) return;

    this.progressIndicator = new Label();
    this.progressIndicator.set_name("ProgressIndicator");
    this.progressIndicator.add_theme_font_size_override("font_size", 12);
    this.progressIndicator.add_theme_color_override("font_color", new Color(0.7, 0.7, 0.7));
    this.progressIndicator.reparent(this.container);
  }

  /**
   * 显示引导步骤
   */
  public ShowStep(
    stepData: TutorialStepData,
    config: TutorialConfig,
    currentStep: number,
    totalSteps: number
  ): void {
    this.currentStepData = stepData;
    this.currentConfig = config;

    // 更新标题
    if (this.tooltipTitle) {
      this.tooltipTitle.text = stepData.title || "";
      this.tooltipTitle.visible = !!stepData.title;
    }

    // 更新内容
    if (this.tooltipContent) {
      this.tooltipContent.text = stepData.description;
    }

    // 更新按钮
    this.updateButtons(config, currentStep, totalSteps);

    // 更新进度指示器
    this.updateProgress(currentStep, totalSteps, config.showProgressIndicator ?? true);

    // 显示高亮目标
    this.showHighlight(stepData);

    // 显示 UI
    this.Enable();
  }

  /**
   * 更新按钮显示状态
   */
  private updateButtons(config: TutorialConfig, currentStep: number, totalSteps: number): void {
    if (!this.nextButton || !this.skipButton) return;

    const isLastStep = currentStep >= totalSteps - 1;
    this.nextButton.text = isLastStep 
      ? (config.completeButtonText || "完成") 
      : (config.skipButtonText || "下一步");

    this.skipButton.visible = config.allowSkip ?? true;
    this.skipButton.text = config.skipButtonText || "跳过";
  }

  /**
   * 更新进度指示器
   */
  private updateProgress(currentStep: number, totalSteps: number, show: boolean): void {
    if (!this.progressIndicator) return;

    this.progressIndicator.visible = show;
    this.progressIndicator.text = `${currentStep + 1} / ${totalSteps}`;
  }

  /**
   * 显示高亮目标
   */
  private showHighlight(stepData: TutorialStepData): void {
    const needHighlight = [
      TutorialStepType.CLICK,
      TutorialStepType.DRAG,
      TutorialStepType.MENU_SELECT
    ].includes(stepData.type);

    if (needHighlight && this.highlightMask) {
      this.highlightMask.visible = true;
    } else if (this.highlightMask) {
      this.highlightMask.visible = false;
    }
  }

  /**
   * 隐藏引导 UI
   */
  public HideStep(): void {
    this.Disable();
  }

  /**
   * 设置下一步回调
   */
  public SetOnNextCallback(callback: () => void): void {
    this.onNextCallback = callback;
  }

  /**
   * 设置跳过回调
   */
  public SetOnSkipCallback(callback: () => void): void {
    this.onSkipCallback = callback;
  }

  /**
   * 下一步按钮点击
   */
  private onNextButtonPressed(): void {
    if (this.onNextCallback) {
      this.onNextCallback();
    }
  }

  /**
   * 跳过按钮点击
   */
  private onSkipButtonPressed(): void {
    if (this.onSkipCallback) {
      this.onSkipCallback();
    }
  }

  /**
   * 显示遮罩层
   */
  public ShowMask(): void {
    if (this.maskLayer) {
      this.maskLayer.visible = true;
    }
  }

  /**
   * 隐藏遮罩层
   */
  public HideMask(): void {
    if (this.maskLayer) {
      this.maskLayer.visible = false;
    }
  }

  /**
   * 设置遮罩透明度
   */
  public SetMaskOpacity(opacity: number): void {
    if (this.maskLayer) {
      const color = this.maskLayer.color;
      this.maskLayer.color = new Color(color.r, color.g, color.b, opacity);
    }
  }

  /**
   * 销毁
   */
  public OnDestroy(): void {
    this.currentConfig = null;
    this.currentStepData = null;
    this.onNextCallback = null;
    this.onSkipCallback = null;
  }
}
