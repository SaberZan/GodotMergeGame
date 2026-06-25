import { TutorialStep } from "./TutorialStep";
import { TutorialStepFactory } from "./TutorialStepFactory";
import {
  TutorialConfig,
  TutorialProgress,
  TutorialState,
  TutorialEventType,
  TutorialEventData
} from "./TutorialTypes";
import { MessageMgr } from "../../Message/MessageMgr";
import { SchedulerMgr } from "../../Scheduler/SchedulerMgr";

export class TutorialGuide {
  private config: TutorialConfig;
  private state: TutorialState = TutorialState.IDLE;
  private currentStepIndex: number = -1;
  private steps: TutorialStep[] = [];
  private progress: TutorialProgress;
  private retryCount: number = 0;
  private isPaused: boolean = false;

  constructor(config: TutorialConfig) {
    this.config = config;
    this.progress = this.CreateProgress();
    this.InitializeSteps();
  }

  public GetId(): string {
    return this.config.id;
  }

  public GetName(): string {
    return this.config.name;
  }

  public GetConfig(): TutorialConfig {
    return this.config;
  }

  public GetState(): TutorialState {
    return this.state;
  }

  public GetProgress(): TutorialProgress {
    return this.progress;
  }

  public Start(): void {
    if (this.state !== TutorialState.IDLE && this.state !== TutorialState.STOPPED) {
      return;
    }

    this.state = TutorialState.IN_PROGRESS;
    this.currentStepIndex = -1;
    this.retryCount = 0;
    this.isPaused = false;

    this.EmitEvent(TutorialEventType.START, { tutorialId: this.config.id });
    this.MoveNextStep();
  }

  public Stop(): void {
    if (this.state === TutorialState.IDLE) return;

    this.state = TutorialState.STOPPED;
    SchedulerMgr.Instance().ClearByObj(this);

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Exit();
    }

    this.EmitEvent(TutorialEventType.END, { tutorialId: this.config.id });
  }

  public Pause(): void {
    if (this.state !== TutorialState.IN_PROGRESS) return;

    this.isPaused = true;
    SchedulerMgr.Instance().ClearByObj(this);

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Pause();
    }
  }

  public Resume(): void {
    if (this.state !== TutorialState.IN_PROGRESS || !this.isPaused) return;

    this.isPaused = false;

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Resume();
    }
  }

  public SkipStep(): boolean {
    if (!this.config.allowSkip) return false;
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) return false;

    const currentStep = this.steps[this.currentStepIndex];
    if (currentStep.GetData().required) return false;

    this.EmitEvent(TutorialEventType.STEP_SKIP, {
      tutorialId: this.config.id,
      stepId: currentStep.GetId()
    });

    this.MoveNextStep();
    return true;
  }

  public SkipTutorial(): boolean {
    if (!this.config.allowSkip) return false;

    this.state = TutorialState.SKIPPED;
    this.progress.isSkipped = true;
    SchedulerMgr.Instance().ClearByObj(this);

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Exit();
    }

    this.EmitEvent(TutorialEventType.TUTORIAL_SKIP, { tutorialId: this.config.id });
    this.EmitEvent(TutorialEventType.END, { tutorialId: this.config.id });

    return true;
  }

  public Complete(): void {
    this.state = TutorialState.COMPLETED;
    this.progress.isCompleted = true;
    this.progress.completedStepCount = this.steps.length;

    this.EmitEvent(TutorialEventType.TUTORIAL_COMPLETE, { tutorialId: this.config.id });
    this.EmitEvent(TutorialEventType.END, { tutorialId: this.config.id });
  }

  public Retry(): boolean {
    const maxRetry = this.config.maxRetry || 3;
    if (this.retryCount >= maxRetry) return false;

    this.retryCount++;

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Exit();
      this.steps[this.currentStepIndex].Enter();
    }

    return true;
  }

  public Update(deltaTime: number): void {
    if (this.state !== TutorialState.IN_PROGRESS || this.isPaused) return;

    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Update(deltaTime);
    }
  }

  public GetCurrentStep(): TutorialStep | null {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  public Destroy(): void {
    this.Stop();
    for (const step of this.steps) {
      step.Destroy();
    }
    this.steps = [];
  }

  private MoveNextStep(): void {
    if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
      this.steps[this.currentStepIndex].Exit();
      this.progress.completedStepCount++;
    }

    this.currentStepIndex++;
    this.progress.currentStepIndex = this.currentStepIndex;
    this.progress.lastUpdateTime = Date.now();

    if (this.currentStepIndex >= this.steps.length) {
      if (this.config.loop) {
        this.currentStepIndex = 0;
        this.progress.completedStepCount = 0;
      } else {
        this.Complete();
        return;
      }
    }

    const currentStep = this.steps[this.currentStepIndex];
    const stepData = currentStep.GetData();

    if (stepData.delay && stepData.delay > 0) {
      const self = this;
      SchedulerMgr.Instance().Register(
        this,
        function() {
          self.EnterStep(currentStep);
        } as Function,
        [],
        1,
        stepData.delay
      );
    } else {
      this.EnterStep(currentStep);
    }
  }

  private EnterStep(step: TutorialStep): void {
    step.Enter();

    this.EmitEvent(TutorialEventType.STEP_START, {
      tutorialId: this.config.id,
      stepId: step.GetId()
    });

    step.OnComplete(() => {
      this.OnStepComplete(step);
    });
  }

  private OnStepComplete(step: TutorialStep): void {
    this.EmitEvent(TutorialEventType.STEP_COMPLETE, {
      tutorialId: this.config.id,
      stepId: step.GetId()
    });
    this.MoveNextStep();
  }

  private InitializeSteps(): void {
    this.steps = [];
    for (const stepData of this.config.steps) {
      const step = TutorialStepFactory.Instance().CreateStep(stepData);
      this.steps.push(step);
    }
    this.progress.totalStepCount = this.steps.length;
  }

  private CreateProgress(): TutorialProgress {
    return {
      tutorialId: this.config.id,
      currentStepIndex: 0,
      completedStepCount: 0,
      totalStepCount: this.config.steps.length,
      isCompleted: false,
      isSkipped: false,
      retryCount: 0,
      lastUpdateTime: Date.now()
    };
  }

  private EmitEvent(type: TutorialEventType, data: any): void {
    const eventData: TutorialEventData = {
      type,
      tutorialId: this.config.id,
      ...data
    };
    MessageMgr.Instance().Emit(type, eventData);
  }
}
