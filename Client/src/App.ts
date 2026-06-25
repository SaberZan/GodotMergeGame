import { SaveDataMgr } from './Data/SaveData/SaveDataMgr';
import { AssetsMgr } from './Assets/AssetsMgr';
import { MessageMgr } from './Message/MessageMgr';
import { ConfigMgr } from './Config/ConfigMgr';
import { LoggerMgr } from './Logger/LoggerMgr';
import { SchedulerMgr, SchedulerObj } from './Scheduler/SchedulerMgr';
import { InputMgr } from './Input/InputMgr';
import { AudioMgr } from './Audio/AudioMgr';
import { AnalysisMgr } from './Analysis/AnalysisMgr';
import { NodePoolMgr } from './Pool/NodePoolMgr';
import { UIMgr } from './UI/UIMgr';
import { FindPathMgr } from './FindPath/FindPathMgr';
import { NetMgr } from './Net/NetMgr';
import { Scenes } from "./Scene/Index";
import { BaseScene } from './Scene/BaseScene';
import { Singleton } from './Utils/Singleton';
import { TimeMgr } from './Time/TimeMgr';
import { ProxyMgr } from './Proxy/ProxyMgr';
import { InputEvent, Node, OS } from 'godot';

export default class App extends Node {

	public static node: Node;

	private inited: boolean = false;

	private platfrom: string | undefined;

	private scene: BaseScene | undefined;

	public Init() {
		App.node = this;
		this.platfrom = OS.get_name();
		//使用AA资源管理时，必须等待
		setTimeout(async () => {
			console.log("Init============ start");
			await this.InitMgr();
			this.inited = true;
			console.log("Init============ end");
			this.ChangeSceneByIndex(0);
		}, 100);
	}

	public async InitMgr() {

		await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve("");
            },3000);
        });

		console.log("InitMgr============ServiceMgr start");
		await ProxyMgr.Instance().Init();
		console.log("InitMgr============TimeMgr start");
		await TimeMgr.Instance().Init(Date.now());
		console.log("InitMgr============MessageMgr start");
		await MessageMgr.Instance().Init();
		console.log("InitMgr============LoggerMgr start");
		await LoggerMgr.Instance().Init();
		console.log("InitMgr============AnalysisMgr start");
		await AnalysisMgr.Instance().Init();
		console.log("InitMgr============AssetsMgr start");
		await AssetsMgr.Instance().Init();
		console.log("InitMgr============ConfigMgr start");
		await ConfigMgr.Instance().Init();
		console.log("InitMgr============SaveDataMgr start");
		await SaveDataMgr.Instance().Init();
		console.log("InitMgr============SoundMgr start");
		await AudioMgr.Instance().Init();
		console.log("InitMgr============ShedulerMgr start");
		await SchedulerMgr.Instance().Init();
		console.log("InitMgr============NodePoolMgr start");
		await NodePoolMgr.Instance().Init();
		console.log("InitMgr============UIMgr start");
		await UIMgr.Instance().Init();
		console.log("InitMgr============FindPathMgr start");
		await FindPathMgr.Instance().Init();
		console.log("InitMgr============NetMgr start");
		await NetMgr.Instance().Init();
		console.log("InitMgr============InputMgr start");
		await InputMgr.Instance().Init();
	}

	public _ready() {
		this.Init();
	}

	public _process(detalTime: number) {
		if (this.inited) {
			SchedulerMgr.Instance().Update(detalTime);
			NetMgr.Instance().Update(detalTime);
			this.scene?.Update(detalTime);
		}
	}

	public _input(event: InputEvent): void {
		if (this.inited) {
			InputMgr.Instance().Input(event);
		}
	}

	public _notification(what: number): void {
		if (this.inited) {
			// if(what == MainLoop.NOTIFICATION_WM_CLOSE_REQUEST)
			// {

			// }
		}
	}

	public ChangeSceneByIndex(sceneIndex: number) {
		if (sceneIndex < Scenes.length) {
			this.scene?.Destroy();
			this.scene = new Scenes[sceneIndex].Scene();
			this.scene?.Start();
		}
	}

	public ChangeSceneByName(sceneName: string) {
		for (let sceneIndex = 0; sceneIndex < Scenes.length; ++sceneIndex) {
			if (Scenes[sceneIndex].SceneName == sceneName) {
				this.ChangeSceneByIndex(sceneIndex);
				break;
			}
		}
	}

	public GetEasyConfig() {

	}
}
