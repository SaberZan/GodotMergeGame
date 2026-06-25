import { Singleton } from "../../Utils/Singleton";
import * as Datas from "./Data/Index";
import { SaveData } from "./Data/SaveData";
import { LoggerMgr } from "../../Logger/LoggerMgr";
import { Serialize } from "../../Extra/Serialize/Serialize";
import { FileAccess } from "godot";

export class SaveDataMgr extends Singleton<SaveDataMgr> {

    private saveDatas: { [key: string]: SaveData } = {};

    private saveInfo: string[] = [];

    private saveTag: boolean = false;

    public ReadAll() {
        var file = FileAccess.open("user://save_game.dat", FileAccess.ModeFlags.READ_WRITE)
        this.saveDatas = JSON.parse(file?.get_as_text() ?? "");
    }

    public WriteAll() {

        var file = FileAccess.open("user://save_game.dat", FileAccess.ModeFlags.WRITE)
        file?.store_string(JSON.stringify(this.saveDatas));
    }

    public ClearAll() {
        this.saveDatas = {}
        this.WriteAll();
    }

    public Get<T extends SaveData>(key: string): T {
        return <T>this.saveDatas[key];
    }


    public BeginSave(key: string) {
        if (this.saveInfo.length == 0) {
            this.saveTag = true;
        }
        this.saveInfo.push(key);
    }


    public EndSave(key: string) {
        this.saveInfo.pop();
        if (this.saveTag && this.saveInfo.length == 0) {
            this.WriteAll();
        }
    }
}