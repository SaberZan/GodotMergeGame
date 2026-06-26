import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 等待步骤
 * 用于在引导流程中添加延迟或等待特定条件
 */
export class WaitStep extends TutorialStep {
  /** 等待时间（毫秒） */
  private waitTime: number = 1000;

  /** 已等待时间 */
  private elapsedWaitTime: number = 0;

  /** 是否等待条件而非时间 */
  private waitForCondition: boolean = false;

  /** 等待条件回调 */
  private conditionCallback: (() => boolean) | null = null;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.waitTime = stepData.customData.waitTime ?? 1000;
      this.waitForCondition = stepData.customData.waitForCondition ?? false;
      this.conditionCallback = stepData.customData.conditionCallback;
    }
    
    if (stepData.delay) {
      this.waitTime = stepData.delay;
    }
  }

  protected OnEnter(): void {
    this.elapsedWaitTime = 0;
    console.log(`[WaitStep] Starting wait: ${this.waitTime}ms`);
    
    if (!this.waitForCondition && this.waitTime > 0) {
      setTimeout(() => {
        if (this.IsActive()) {
          this.Complete();
        }
      }, this.waitTime);
    }
  }

  protected OnExit(): void {
    console.log(`[WaitStep] Exit: ${this.stepData.id}`);
  }

  protected OnCompleteInternal(): void {
    console.log(`[WaitStep] Wait completed: ${this.stepData.id}`);
  }

  protected OnUpdate(deltaTime: number): void {
    if (this.waitForCondition && this.conditionCallback) {
      if (this.conditionCallback()) {
        this.Complete();
        return;
      }
    }

    this.elapsedWaitTime += deltaTime * 1000;
  }

  protected OnResetInternal(): void {
    this.elapsedWaitTime = 0;
  }

  public GetWaitTime(): number {
    return this.waitTime;
  }

  public GetElapsedWaitTime(): number {
    return this.elapsedWaitTime;
  }

  public IsWaitingForCondition(): boolean {
    return this.waitForCondition;
  }

  public SetWaitCondition(condition: () => boolean): void {
    this.conditionCallback = condition;
    this.waitForCondition = true;
  }

  public SetWaitTime(time: number): void {
    this.waitTime = time;
    this.waitForCondition = false;
  }
}
