import { TutorialStep } from "../TutorialStep";
import { TutorialStepData } from "../TutorialTypes";

/**
 * 菜单选择步骤
 * 用于引导用户从菜单中选择特定选项
 */
export class MenuSelectStep extends TutorialStep {
  /** 目标菜单选项索引 */
  private targetOptionIndex: number = 0;

  /** 目标菜单选项文本 */
  private targetOptionText: string = "";

  /** 菜单选项列表 */
  private menuOptions: string[] = [];

  /** 已选择的选项 */
  private selectedOption: string | null = null;

  constructor(stepData: TutorialStepData) {
    super(stepData);
    
    if (stepData.customData) {
      this.targetOptionIndex = stepData.customData.targetOptionIndex ?? 0;
      this.targetOptionText = stepData.customData.targetOptionText ?? "";
      this.menuOptions = stepData.customData.menuOptions ?? [];
    }
  }

  protected OnEnter(): void {
    this.selectedOption = null;
    this.HighlightTargetOption();
    this.RegisterMenuListener();
    console.log(`[MenuSelectStep] Waiting for menu selection`);
  }

  protected OnExit(): void {
    this.UnhighlightTargetOption();
    this.RemoveMenuListener();
  }

  protected OnCompleteInternal(): void {
    console.log(`[MenuSelectStep] Menu selection completed: ${this.selectedOption}`);
    this.UnhighlightTargetOption();
    this.RemoveMenuListener();
  }

  protected OnUpdate(deltaTime: number): void {
    if (this.selectedOption !== null) {
      this.Complete();
    }
  }

  protected OnSkipInternal(): void {
    this.UnhighlightTargetOption();
    this.RemoveMenuListener();
  }

  protected OnResetInternal(): void {
    this.selectedOption = null;
  }

  public HandleMenuSelect(optionText: string, optionIndex: number): void {
    if (!this.IsActive()) {
      return;
    }

    console.log(`[MenuSelectStep] Menu option selected: ${optionText}`);
    
    const isCorrectByIndex = optionIndex === this.targetOptionIndex;
    const isCorrectByText = this.targetOptionText && optionText === this.targetOptionText;
    
    if (isCorrectByIndex || isCorrectByText) {
      this.selectedOption = optionText;
      console.log(`[MenuSelectStep] Correct option selected!`);
    }
  }

  private HighlightTargetOption(): void {
    console.log(`[MenuSelectStep] Highlighting target menu option`);
  }

  private UnhighlightTargetOption(): void {
    console.log(`[MenuSelectStep] Unhighlighting target menu option`);
  }

  private RegisterMenuListener(): void {
    console.log(`[MenuSelectStep] Registering menu listener`);
  }

  private RemoveMenuListener(): void {
    console.log(`[MenuSelectStep] Removing menu listener`);
  }

  public GetMenuOptions(): string[] {
    return this.menuOptions;
  }

  public GetSelectedOption(): string | null {
    return this.selectedOption;
  }

  public GetTargetOptionIndex(): number {
    return this.targetOptionIndex;
  }

  public GetTargetOptionText(): string {
    return this.targetOptionText;
  }
}
