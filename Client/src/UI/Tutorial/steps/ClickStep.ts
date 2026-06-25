import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 点击交互步骤
 * 用于引导用户点击特定目标
 */
export class ClickStep extends TutorialStep {
  /** 点击次数要求 */
  private requiredClickCount: number = 1;

  /** 已点击次数 */
  private clickCount: number = 0;

  /** 是否高亮目标 */
  private highlightTarget: boolean = true;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.requiredClickCount = stepData.customData.requiredClickCount ?? 1;
      this.highlightTarget = stepData.customData.highlightTarget ?? true;
    }
  }

  protected OnEnter(): void {
    this.clickCount = 0;
    
    // 高亮目标节点
    if (this.highlightTarget) {
      this.HighlightTarget();
    }
    
    // 注册点击监听
    this.RegisterClickListener();
    
    console.log(`[ClickStep] Waiting for click on target: ${this.stepData.targetPath}`);
  }

  protected OnExit(): void {
    // 取消高亮
    this.UnhighlightTarget();
    
    // 移除点击监听
    this.RemoveClickListener();
  }

  protected OnCompleteInternal(): void {
    console.log(`[ClickStep] Click completed: ${this.stepData.id}`);
    this.UnhighlightTarget();
    this.RemoveClickListener();
  }

  protected OnUpdate(deltaTime: number): void {
    // 检查点击次数是否达标
    if (this.clickCount >= this.requiredClickCount) {
      this.Complete();
    }
  }

  protected OnSkipInternal(): void {
    this.UnhighlightTarget();
    this.RemoveClickListener();
  }

  protected OnResetInternal(): void {
    this.clickCount = 0;
  }

  /**
   * 处理点击事件
   */
  public HandleClick(node: any): void {
    if (!this.IsActive()) {
      return;
    }

    this.clickCount++;
    
    // 执行点击回调
    if (this.stepData.onClick) {
      this.stepData.onClick(node);
    }
    
    console.log(`[ClickStep] Click detected, count: ${this.clickCount}/${this.requiredClickCount}`);
  }

  /**
   * 高亮目标节点
   */
  private HighlightTarget(): void {
    console.log(`[ClickStep] Highlighting target node`);
  }

  /**
   * 取消高亮
   */
  private UnhighlightTarget(): void {
    console.log(`[ClickStep] Unhighlighting target node`);
  }

  /**
   * 注册点击监听器
   */
  private RegisterClickListener(): void {
    console.log(`[ClickStep] Registering click listener`);
  }

  /**
   * 移除点击监听器
   */
  private RemoveClickListener(): void {
    console.log(`[ClickStep] Removing click listener`);
  }

  /**
   * 获取当前点击次数
   */
  public GetClickCount(): number {
    return this.clickCount;
  }

  /**
   * 获取所需点击次数
   */
  public GetRequiredClickCount(): number {
    return this.requiredClickCount;
  }
}
