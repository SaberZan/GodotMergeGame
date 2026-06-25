import { TutorialStepData, TutorialEventType } from "./TutorialTypes";
import { MessageMgr } from "../../Message/MessageMgr";
import { SchedulerMgr } from "../../Scheduler/SchedulerMgr";

/**
 * 引导步骤基类
 * 所有具体步骤都继承此基类
 */
export abstract class TutorialStep {
  /** 步骤数据 */
  protected stepData: TutorialStepData;

  /** 是否已完成 */
  protected isCompleted: boolean = false;

  /** 是否激活（正在执行） */
  protected isActive: boolean = false;

  /** 是否暂停 */
  protected isPaused: boolean = false;

  /** 完成回调列表 */
  private completeCallbacks: (() => void)[] = [];

  constructor(stepData: TutorialStepData) {
    this.stepData = stepData;
  }

  public GetId(): string {
    return this.stepData.id;
  }

  public GetData(): TutorialStepData {
    return this.stepData;
  }

  public IsCompleted(): boolean {
    return this.isCompleted;
  }

  public IsActive(): boolean {
    return this.isActive;
  }

  public CanSkip(): boolean {
    return !this.stepData.required;
  }

  public Enter(): void {
    if (this.isCompleted) {
      return;
    }

    this.isActive = true;
    this.isPaused = false;

    MessageMgr.Instance().Emit(TutorialEventType.STEP_START, {
      stepId: this.stepData.id,
      stepData: this.stepData
    });

    if (this.stepData.delay && this.stepData.delay > 0) {
      const self = this;
      SchedulerMgr.Instance().Register(
        this,
        function() {
          self.OnEnter();
        } as Function,
        [],
        1,
        this.stepData.delay,
        1
      );
    } else {
      this.OnEnter();
    }
  }

  public Exit(): void {
    this.isActive = false;
    this.isPaused = false;
    SchedulerMgr.Instance().ClearByObj(this);
    this.OnExit();
  }

  public Pause(): void {
    if (!this.isActive) return;
    this.isPaused = true;
    this.OnPause();
  }

  public Resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.OnResume();
  }

  public Update(deltaTime: number): void {
    if (!this.isActive || this.isPaused || this.isCompleted) return;

    if (this.stepData.stopCondition && this.stepData.stopCondition()) {
      this.Complete();
      return;
    }

    this.OnUpdate(deltaTime);
  }

  public Complete(): void {
    if (this.isCompleted) return;

    this.isCompleted = true;
    this.isActive = false;
    this.isPaused = false;

    SchedulerMgr.Instance().ClearByObj(this);

    MessageMgr.Instance().Emit(TutorialEventType.STEP_COMPLETE, {
      stepId: this.stepData.id
    });

    if (this.stepData.onComplete) {
      this.stepData.onComplete();
    }

    for (const callback of this.completeCallbacks) {
      callback();
    }

    this.OnCompleteInternal();
  }

  public Skip(): void {
    if (this.isCompleted) return;

    this.isCompleted = false;
    this.isActive = false;
    this.isPaused = false;

    SchedulerMgr.Instance().ClearByObj(this);

    MessageMgr.Instance().Emit(TutorialEventType.STEP_SKIP, {
      stepId: this.stepData.id
    });

    this.OnSkipInternal();
  }

  public Reset(): void {
    this.isCompleted = false;
    this.isActive = false;
    this.isPaused = false;
    SchedulerMgr.Instance().ClearByObj(this);
    this.OnResetInternal();
  }

  public Destroy(): void {
    this.Exit();
    this.completeCallbacks = [];
    this.OnDestroyInternal();
  }

  public OnComplete(callback: () => void): void {
    this.completeCallbacks.push(callback);
  }

  protected abstract OnEnter(): void;
  protected abstract OnExit(): void;
  protected abstract OnUpdate(deltaTime: number): void;

  protected OnCompleteInternal(): void {}
  protected OnSkipInternal(): void {}
  protected OnPause(): void {}
  protected OnResume(): void {}
  protected OnResetInternal(): void {}
  protected OnDestroyInternal(): void {}

  public GetStepData(): TutorialStepData {
    return this.stepData;
  }
}
