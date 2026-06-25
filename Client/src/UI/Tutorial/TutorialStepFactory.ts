import { TutorialStep } from "./TutorialStep";
import { TutorialStepData, TutorialStepType } from "./TutorialTypes";
import { TextStep } from "./steps/TextStep";
import { ClickStep } from "./steps/ClickStep";
import { DragStep } from "./steps/DragStep";
import { ScrollStep } from "./steps/ScrollStep";
import { MenuSelectStep } from "./steps/MenuSelectStep";
import { WaitStep } from "./steps/WaitStep";
import { CustomStep } from "./steps/CustomStep";

/**
 * 步骤创建函数类型
 */
type StepCreator = (data: TutorialStepData) => TutorialStep;

/**
 * 引导步骤工厂类
 * 负责根据步骤类型创建对应的步骤实例
 */
export class TutorialStepFactory {
  private static instance: TutorialStepFactory;

  /** 步骤创建函数映射表 */
  private stepCreators: Map<TutorialStepType, StepCreator>;

  private constructor() {
    this.stepCreators = new Map();
    this.RegisterDefaultSteps();
  }

  /**
   * 获取单例实例
   */
  public static Instance(): TutorialStepFactory {
    if (!TutorialStepFactory.instance) {
      TutorialStepFactory.instance = new TutorialStepFactory();
    }
    return TutorialStepFactory.instance;
  }

  /**
   * 注册步骤创建函数
   * @param stepType 步骤类型
   * @param creator 创建函数
   */
  public RegisterStepCreator(stepType: TutorialStepType, creator: StepCreator): void {
    this.stepCreators.set(stepType, creator);
  }

  /**
   * 创建步骤实例
   * @param data 步骤数据
   * @returns 步骤实例
   */
  public CreateStep(data: TutorialStepData): TutorialStep {
    const creator = this.stepCreators.get(data.type);

    if (!creator) {
      console.warn(`[TutorialStepFactory] No creator registered for step type: ${data.type}, using TextStep as fallback`);
      return new TextStep(data);
    }

    return creator(data);
  }

  /**
   * 检查是否已注册步骤类型
   * @param stepType 步骤类型
   */
  public HasStepCreator(stepType: TutorialStepType): boolean {
    return this.stepCreators.has(stepType);
  }

  /**
   * 移除步骤创建函数
   * @param stepType 步骤类型
   */
  public UnregisterStepCreator(stepType: TutorialStepType): void {
    this.stepCreators.delete(stepType);
  }

  /**
   * 清空所有注册
   */
  public ClearAll(): void {
    this.stepCreators.clear();
  }

  /**
   * 注册默认步骤类型
   */
  private RegisterDefaultSteps(): void {
    // 文本提示步骤
    this.RegisterStepCreator(TutorialStepType.TEXT, (data) => new TextStep(data));

    // 点击交互步骤
    this.RegisterStepCreator(TutorialStepType.CLICK, (data) => new ClickStep(data));

    // 拖拽交互步骤
    this.RegisterStepCreator(TutorialStepType.DRAG, (data) => new DragStep(data));

    // 滚轮交互步骤
    this.RegisterStepCreator(TutorialStepType.SCROLL, (data) => new ScrollStep(data));

    // 菜单选择步骤
    this.RegisterStepCreator(TutorialStepType.MENU_SELECT, (data) => new MenuSelectStep(data));

    // 等待步骤
    this.RegisterStepCreator(TutorialStepType.WAIT, (data) => new WaitStep(data));

    // 自定义步骤
    this.RegisterStepCreator(TutorialStepType.CUSTOM, (data) => new CustomStep(data));
  }
}
