import { DialogType, UIMgr } from "../UIMgr";
import { BaseUI } from "../BaseUI";
import { DialogUILayer } from "./DialogUILayer";

export class BaseDialogUI extends BaseUI {

	public IsBlackClickClose(): boolean {
		return true;
	}

	public IsShowBlack(): boolean {
		return true;
	}

	public ShowDialog() {

	}

	public HideDialog() {

	}

	public Close() {
		UIMgr.Instance().GetLayer<DialogUILayer>(DialogUILayer.name).CloseDialog(this);
	}

	public OnBackPressed() {
	}

	public GetDialogType(): DialogType {
		return DialogType.NORMAL;
	}
}
