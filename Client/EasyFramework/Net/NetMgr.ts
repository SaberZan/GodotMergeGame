import { Singleton } from "../Utils/Singleton";

enum HttpType {
    Get,
    Post
}

class HttpData {
    url: string = "";
    type: string = "";
    httpType: HttpType = HttpType.Get;
    data: { [key: string]: string } = {};
    success: Function | undefined = undefined;
    fail: Function | undefined = undefined;
}

export class NetMgr extends Singleton<NetMgr> {

    private isInHttpRequest: boolean = false;

    private httpDatas: HttpData[] = [];

    public RequestHttp(httpData: HttpData) {
        this.httpDatas.push(httpData);
    }

    private SendRequestHttp(httpData: HttpData) {
        let request = new XMLHttpRequest();
        request.open(httpData.httpType == HttpType.Get ? "get" : "post", httpData.url, true);
        let data;
        if (httpData.type === "formdata") {
            data = new FormData();
            for (let key in httpData.data) {
                data.append(key, httpData.data[key]);
            }
        } else if (httpData.type === "json") {
            request.setRequestHeader("Content-Type", "application/json");
            data = JSON.stringify(httpData.data);
        } else if (httpData.type === "text") {
            data = "";
            for (let key in httpData.data) {
                data += key + "=" + httpData.data[key] + "&";
            }
        } else if (httpData.type === "www") {
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            data = "";
            for (let key in httpData.data) {
                data += key + "=" + httpData.data[key] + "&";
            }
        }
        request.send(data);
        request.onreadystatechange = () => {
            if (request.readyState == 4 && request.status == 200) {
                httpData.success?.caller(request.responseText);
            } else {
                httpData.fail?.caller();
            }
            this.isInHttpRequest = false;
        }
    }

    public Update(detailTime: number) {
        if (!this.isInHttpRequest && this.httpDatas.length > 0) {
            let httpData = this.httpDatas.shift();
            if (httpData) {
                this.SendRequestHttp(httpData);
                this.isInHttpRequest = true;
            }

        }
    }
}