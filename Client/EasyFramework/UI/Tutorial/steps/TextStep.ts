import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 文本提示步骤
 * 用于显示文字说明和提示信息
 */
export class TextStep extends TutorialStep {
  /** 提示文本 */
  private textContent: string = "";

  /** 是否显示确认按钮 */
  private showConfirmButton: boolean = true;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    this.textContent = stepData.description;
  }

  protected OnEnter(): void {
    // 初始化文本内容
    if (this.stepData.customData) {
      this.showConfirmButton = this.stepData.customData.showConfirmButton ?? true;
    }

    // 显示文本提示 UI
    console.log(`[TextStep] Displaying text: ${this.textContent}`);
    
    // 这里应该调用 TutorialGuideUI 显示文本提示
    // 实际实现中需要与 UI 层集成
  }

  protected OnExit(): void {
    console.log(`[TextStep] Exit: ${this.stepData.id}`);
  }

  protected OnCompleteInternal(): void {
    console.log(`[TextStep] Text display completed: ${this.stepData.id}`);
  }

  protected OnUpdate(deltaTime: number): void {
    // 文本步骤通常不需要持续更新
    // 但可以在这里处理等待用户确认的逻辑
  }

  /**
   * 用户点击确认按钮时调用
   */
  public OnUserConfirm(): void {
    if (this.IsActive()) {
      this.Complete();
    }
  }

  /**
   * 设置文本内容
   */
  public SetTextContent(text: string): void {
    this.textContent = text;
  }

  /**
   * 获取文本内容
   */
  public GetTextContent(): string {
    return this.textContent;
  }

  /**
   * 是否显示确认按钮
   */
  public ShouldShowConfirmButton(): boolean {
    return this.showConfirmButton;
  }
}
