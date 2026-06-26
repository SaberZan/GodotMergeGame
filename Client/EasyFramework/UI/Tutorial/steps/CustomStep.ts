import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 自定义步骤
 * 用于实现完全自定义的引导逻辑
 */
export class CustomStep extends TutorialStep {
  /** 自定义初始化回调 */
  private customOnInit: (() => void) | null = null;

  /** 自定义开始回调 */
  private customOnStart: (() => void) | null = null;

  /** 自定义完成回调 */
  private customOnComplete: (() => void) | null = null;

  /** 自定义更新回调 */
  private customOnUpdate: ((deltaTime: number) => void) | null = null;

  /** 自定义检查完成条件回调 */
  private customCheckCompletion: (() => boolean) | null = null;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.customOnInit = stepData.customData.onInit;
      this.customOnStart = stepData.customData.onStart;
      this.customOnComplete = stepData.customData.onComplete;
      this.customOnUpdate = stepData.customData.onUpdate;
      this.customCheckCompletion = stepData.customData.checkCompletion;
    }
  }

  protected OnEnter(): void {
    console.log(`[CustomStep] Enter: ${this.stepData.id}`);
    
    if (this.customOnInit) {
      this.customOnInit();
    }
    
    if (this.customOnStart) {
      this.customOnStart();
    }
  }

  protected OnExit(): void {
    console.log(`[CustomStep] Exit: ${this.stepData.id}`);
  }

  protected OnCompleteInternal(): void {
    console.log(`[CustomStep] Complete: ${this.stepData.id}`);
    
    if (this.customOnComplete) {
      this.customOnComplete();
    }
  }

  protected OnUpdate(deltaTime: number): void {
    if (this.customOnUpdate) {
      this.customOnUpdate(deltaTime);
    }
    
    if (this.customCheckCompletion && this.customCheckCompletion()) {
      this.Complete();
    }
  }

  public SetCustomCallbacks(callbacks: {
    onInit?: () => void;
    onStart?: () => void;
    onComplete?: () => void;
    onUpdate?: (deltaTime: number) => void;
    checkCompletion?: () => boolean;
  }): void {
    if (callbacks.onInit) this.customOnInit = callbacks.onInit;
    if (callbacks.onStart) this.customOnStart = callbacks.onStart;
    if (callbacks.onComplete) this.customOnComplete = callbacks.onComplete;
    if (callbacks.onUpdate) this.customOnUpdate = callbacks.onUpdate;
    if (callbacks.checkCompletion) this.customCheckCompletion = callbacks.checkCompletion;
  }

  public ManualComplete(): void {
    if (this.IsActive()) {
      this.Complete();
    }
  }

  public GetCustomData(): any {
    return this.stepData.customData;
  }
}
