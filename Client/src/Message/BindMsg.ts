import { MessageMgr } from "./MessageMgr";

export function BindMsg(...messgeNames: string[]) {
    return function (target: any, methodName: any) {
        for (var messgeName in messgeNames)
            MessageMgr.Instance().On(messgeName, target, target[methodName]);
    }
}