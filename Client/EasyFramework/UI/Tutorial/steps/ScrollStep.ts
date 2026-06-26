import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 滚动交互步骤
 * 用于引导用户进行滚轮/滑动操作
 */
export class ScrollStep extends TutorialStep {
  /** 滚动方向要求 */
  private scrollDirection: 'up' | 'down' | 'left' | 'right' = 'down';

  /** 滚动距离要求 */
  private requiredScrollDistance: number = 100;

  /** 已滚动距离 */
  private scrolledDistance: number = 0;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.scrollDirection = stepData.customData.scrollDirection ?? 'down';
      this.requiredScrollDistance = stepData.customData.requiredScrollDistance ?? 100;
    }
  }

  protected OnEnter(): void {
    this.scrolledDistance = 0;
    this.ShowScrollHint();
    this.RegisterScrollListener();
    console.log(`[ScrollStep] Waiting for scroll: ${this.scrollDirection}`);
  }

  protected OnExit(): void {
    this.RemoveScrollListener();
    this.HideScrollHint();
  }

  protected OnCompleteInternal(): void {
    console.log(`[ScrollStep] Scroll completed: ${this.stepData.id}`);
    this.RemoveScrollListener();
    this.HideScrollHint();
  }

  protected OnUpdate(deltaTime: number): void {
    if (this.scrolledDistance >= this.requiredScrollDistance) {
      this.Complete();
    }
  }

  protected OnSkipInternal(): void {
    this.RemoveScrollListener();
    this.HideScrollHint();
  }

  protected OnResetInternal(): void {
    this.scrolledDistance = 0;
  }

  public HandleScroll(direction: 'up' | 'down' | 'left' | 'right', distance: number): void {
    if (!this.IsActive()) {
      return;
    }

    if (direction === this.scrollDirection) {
      this.scrolledDistance += distance;
      
      if (this.stepData.onScroll) {
        this.stepData.onScroll(null);
      }
      
      console.log(`[ScrollStep] Scroll: ${direction}, total: ${this.scrolledDistance}`);
    }
  }

  private ShowScrollHint(): void {
    console.log(`[ScrollStep] Showing scroll hint`);
  }

  private HideScrollHint(): void {
    console.log(`[ScrollStep] Hiding scroll hint`);
  }

  private RegisterScrollListener(): void {
    console.log(`[ScrollStep] Registering scroll listener`);
  }

  private RemoveScrollListener(): void {
    console.log(`[ScrollStep] Removing scroll listener`);
  }

  public GetScrolledDistance(): number {
    return this.scrolledDistance;
  }

  public GetRequiredScrollDistance(): number {
    return this.requiredScrollDistance;
  }

  public GetScrollDirection(): string {
    return this.scrollDirection;
  }
}
