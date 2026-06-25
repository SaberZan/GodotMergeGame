import { print, printerr } from "godot";
import { Singleton } from "../Utils/Singleton";

export class LoggerMgr extends Singleton<LoggerMgr> {

    private debug: boolean = true;

    public Log(...args: any[]) {
        if (this.debug)
            print(args.join(","));
    }

    public LogWaring(...args: any[]) {
        if (this.debug)
            printerr(args.join(","));
    }

    public LogError(...args: any[]) {
        if (this.debug)
            printerr(args.join(","));
    }
}