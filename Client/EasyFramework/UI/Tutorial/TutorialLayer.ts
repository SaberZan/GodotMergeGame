import { BaseUILayer } from "../BaseUILayer";
import { TutorialGuide } from "./TutorialGuide";
import { TutorialConfig, TutorialEventData, TutorialState, TutorialStepType } from "./TutorialTypes";
import { MessageMgr } from "../../Message/MessageMgr";
import { TutorialEventType } from "./TutorialTypes";
import { TutorialGuideUI } from "./TutorialGuideUI";
import { BindMsg } from "../../Message/BindMsg";

/**
 * 引导 UI 层
 * 负责显示和管理新手引导 UI
 */
export class TutorialLayer extends BaseUILayer {
  /** 引导配置映射表 */
  private tutorials: Map<string, TutorialGuide> = new Map();

  /** 已完成的引导记录（用于存档） */
  private completedTutorialIds: Set<string> = new Set();

  /** 当前正在执行的引导 */
  private currentTutorial: TutorialGuide | null = null;

  /** 引导 UI */
  private tutorialUI: TutorialGuideUI | null = null;

  constructor() {
    super();
    this.SetUIName("TutorialLayer");
  }

  /**
   * 初始化层
   */
  public OnCreate(): void {
    super.OnCreate();

    // 创建引导 UI
    this.tutorialUI = new TutorialGuideUI();
    this.AddSubUI(this.tutorialUI);
  }

  /**
   * 每帧更新
   */
  public OnUpdate(deltaTime: number): void {
    super.OnUpdate(deltaTime);
    // 更新当前引导
    if (this.currentTutorial) {
      this.currentTutorial.Update(deltaTime);

      // 检查引导状态变化
      const state = this.currentTutorial.GetState();
      if (state === TutorialState.COMPLETED || state === TutorialState.SKIPPED || state === TutorialState.STOPPED) {
        this.onTutorialEnd(this.currentTutorial);
      }
    }
  }

  /**
   * 销毁层
   */
  public OnDestroy(): void {
    
    // 停止所有引导
    for (const [id, guide] of this.tutorials) {
      guide.Destroy();
    }
    this.tutorials.clear();
    this.currentTutorial = null;

    super.OnDestroy();
  }

  /**
   * 注册引导配置
   * @param config 引导配置
   */
  public RegisterTutorial(config: TutorialConfig): void {
    if (this.tutorials.has(config.id)) {
      console.warn(`[TutorialLayer] Tutorial ${config.id} already registered`);
      return;
    }

    const guide = new TutorialGuide(config);
    this.tutorials.set(config.id, guide);
    console.log(`[TutorialLayer] Registered tutorial: ${config.id}`);
  }

  /**
   * 批量注册引导配置
   * @param configs 引导配置数组
   */
  public RegisterTutorials(configs: TutorialConfig[]): void {
    for (const config of configs) {
      this.RegisterTutorial(config);
    }
  }

  /**
   * 启动引导
   * @param tutorialId 引导 ID
   * @returns 是否成功启动
   */
  public StartTutorial(tutorialId: string): boolean {
    const guide = this.tutorials.get(tutorialId);

    if (!guide) {
      console.warn(`[TutorialLayer] Tutorial not found: ${tutorialId}`);
      return false;
    }

    if (this.currentTutorial && this.currentTutorial.GetState() === TutorialState.IN_PROGRESS) {
      console.warn(`[TutorialLayer] Tutorial already in progress: ${this.currentTutorial.GetId()}`);
      return false;
    }

    this.currentTutorial = guide;
    guide.Start();

    // 显示引导 UI
    if (this.tutorialUI) {
      this.tutorialUI.Show();
      this.updateTutorialUI();
    }

    return true;
  }

  /**
   * 停止引导
   * @param tutorialId 引导 ID
   */
  public StopTutorial(tutorialId: string): void {
    const guide = this.tutorials.get(tutorialId);

    if (guide) {
      guide.Stop();
    }

    if (this.currentTutorial?.GetId() === tutorialId) {
      this.currentTutorial = null;
    }
  }

  /**
   * 跳过当前步骤
   * @returns 是否成功跳过
   */
  public SkipCurrentStep(): boolean {
    if (!this.currentTutorial) {
      return false;
    }

    return this.currentTutorial.SkipStep();
  }

  /**
   * 跳过整个引导
   * @returns 是否成功跳过
   */
  public SkipTutorial(): boolean {
    if (!this.currentTutorial) {
      return false;
    }

    return this.currentTutorial.SkipTutorial();
  }

  /**
   * 暂停引导
   */
  public PauseTutorial(): void {
    if (this.currentTutorial) {
      this.currentTutorial.Pause();
    }
  }

  /**
   * 恢复引导
   */
  public ResumeTutorial(): void {
    if (this.currentTutorial) {
      this.currentTutorial.Resume();
    }
  }

  /**
   * 获取引导状态
   * @param tutorialId 引导 ID
   * @returns 引导状态
   */
  public GetTutorialState(tutorialId: string): TutorialState | null {
    const guide = this.tutorials.get(tutorialId);
    return guide ? guide.GetState() : null;
  }

  /**
   * 更新引导 UI
   */
  private updateTutorialUI(): void {
    if (!this.currentTutorial || !this.tutorialUI) {
      return;
    }

    const currentStep = this.currentTutorial.GetCurrentStep();
    if (!currentStep) {
      return;
    }

    const stepData = currentStep.GetData();
    const progress = this.currentTutorial.GetProgress();

    // 获取引导配置
    const guide = this.tutorials.get(progress.tutorialId);
    const config = guide ? guide.GetConfig() : { id: progress.tutorialId, name: "", steps: [] };

    // 显示当前步骤
    this.tutorialUI.ShowStep(
      stepData,
      config,
      progress.currentStepIndex,
      progress.totalStepCount
    );

    // 设置下一步回调
    this.tutorialUI.SetOnNextCallback(() => {
      this.SkipCurrentStep();
    });

    // 设置跳过回调
    this.tutorialUI.SetOnSkipCallback(() => {
      this.SkipTutorial();
    });
  }

  /**
   * 检查引导是否已完成
   * @param tutorialId 引导 ID
   * @returns 是否已完成
   */
  public IsTutorialCompleted(tutorialId: string): boolean {
    const guide = this.tutorials.get(tutorialId);
    if (!guide) return false;
    return guide.GetState() === TutorialState.COMPLETED;
  }

  /**
   * 获取当前正在执行的引导
   * @returns 引导实例
   */
  public GetCurrentTutorial(): TutorialGuide | null {
    return this.currentTutorial;
  }

  /**
   * 获取引导进度
   * @param tutorialId 引导 ID
   * @returns 进度数据
   */
  public GetTutorialProgress(tutorialId: string) {
    const guide = this.tutorials.get(tutorialId);
    return guide ? guide.GetProgress() : null;
  }

  /**
   * 创建快速引导
   * 用于简单的文字提示引导
   * @param id 引导 ID
   * @param name 引导名称
   * @param steps 步骤数据
   * @returns 引导配置
   */
  public CreateQuickTutorial(
    id: string,
    name: string,
    steps: { description: string; title?: string; delay?: number }[]
  ): TutorialConfig {
    return {
      id,
      name,
      steps: steps.map((step, index) => ({
        id: `${id}_step_${index}`,
        type: TutorialStepType.TEXT,
        description: step.description,
        title: step.title,
        delay: step.delay,
        required: true
      })),
      autoStart: false,
      allowSkip: true,
      showProgressIndicator: true
    };
  }

  /**
   * 检查是否有正在进行的引导
   * @returns 是否有活动引导
   */
  public HasActiveTutorial(): boolean {
    return this.currentTutorial !== null && 
           this.currentTutorial.GetState() === TutorialState.IN_PROGRESS;
  }

  /**
   * 引导结束回调
   */
  private onTutorialEnd(guide: TutorialGuide): void {
    const progress = guide.GetProgress();

    // 记录已完成
    if (progress.isCompleted) {
      this.completedTutorialIds.add(guide.GetId());
    }

    // 隐藏 UI
    if (this.tutorialUI) {
      this.tutorialUI.Hide();
    }

    // 清空当前引导
    if (this.currentTutorial === guide) {
      this.currentTutorial = null;
    }
  }

  /**
   * 获取所有已注册的引导 ID
   * @returns 引导 ID 列表
   */
  public GetRegisteredTutorialIds(): string[] {
    return Array.from(this.tutorials.keys());
  }

    /**
   * 步骤完成事件处理
   */
  @BindMsg(TutorialEventType.STEP_COMPLETE)
  private onStepComplete(data: TutorialEventData): void {
    if (this.currentTutorial) {
      this.updateTutorialUI();
    }
  }

  /**
   * 引导开始事件处理
   */
  @BindMsg(TutorialEventType.START)
  private onTutorialStart(data: TutorialEventData): void {
    console.log(`[TutorialMgr] Tutorial started: ${data.tutorialId}`);
  }

  /**
   * 引导结束事件处理
   */
  @BindMsg(TutorialEventType.END)
  private onTutorialEndEvent(data: TutorialEventData): void {
    console.log(`[TutorialMgr] Tutorial ended: ${data.tutorialId}`);
  }

}
