import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 拖拽交互步骤
 * 用于引导用户进行拖拽操作
 */
export class DragStep extends TutorialStep {
  /** 拖拽起点 */
  private dragStartPos: { x: number; y: number } | null = null;

  /** 拖拽终点 */
  private dragEndPos: { x: number; y: number } | null = null;

  /** 目标节点 */
  private targetDropNode: any = null;

  /** 是否正在拖拽 */
  private isDragging: boolean = false;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.dragStartPos = stepData.customData.dragStartPos;
      this.dragEndPos = stepData.customData.dragEndPos;
    }
  }

  protected OnEnter(): void {
    this.ShowDragHint();
    this.RegisterDragListener();
    console.log(`[DragStep] Waiting for drag operation: ${this.stepData.id}`);
  }

  protected OnExit(): void {
    this.RemoveDragListener();
    this.HideDragHint();
  }

  protected OnCompleteInternal(): void {
    console.log(`[DragStep] Drag completed: ${this.stepData.id}`);
    this.RemoveDragListener();
    this.HideDragHint();
  }

  protected OnUpdate(deltaTime: number): void {
    // 检查拖拽是否完成
    if (this.CheckDragCompletion()) {
      this.Complete();
    }
  }

  protected OnStopInternal(): void {
    this.isDragging = false;
    this.RemoveDragListener();
    this.HideDragHint();
  }

  protected OnResetInternal(): void {
    this.isDragging = false;
  }

  /**
   * 处理拖拽开始
   */
  public HandleDragStart(x: number, y: number): void {
    if (!this.IsActive()) {
      return;
    }

    this.isDragging = true;
    console.log(`[DragStep] Drag started at (${x}, ${y})`);
  }

  /**
   * 处理拖拽过程
   */
  public HandleDragMove(x: number, y: number): void {
    if (!this.IsActive() || !this.isDragging) {
      return;
    }
  }

  /**
   * 处理拖拽结束
   */
  public HandleDragEnd(x: number, y: number, dropNode: any): void {
    if (!this.IsActive()) {
      return;
    }

    this.isDragging = false;
    
    if (dropNode && dropNode === this.targetDropNode) {
      if (this.stepData.onDrag) {
        this.stepData.onDrag(dropNode);
      }
      console.log(`[DragStep] Drag ended successfully`);
    }
  }

  private CheckDragCompletion(): boolean {
    return false;
  }

  private ShowDragHint(): void {
    console.log(`[DragStep] Showing drag hint`);
  }

  private HideDragHint(): void {
    console.log(`[DragStep] Hiding drag hint`);
  }

  private RegisterDragListener(): void {
    console.log(`[DragStep] Registering drag listener`);
  }

  private RemoveDragListener(): void {
    console.log(`[DragStep] Removing drag listener`);
  }

  public IsDragging(): boolean {
    return this.isDragging;
  }
}
