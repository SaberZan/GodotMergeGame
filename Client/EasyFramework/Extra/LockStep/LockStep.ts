/**
 * created by SaberZan
 * 帧同步核心
 */

import { Entity } from "./ECS/Entity";
import { World } from "./ECS/World";
import { LockStepConst } from "./LockStepConst";
import { LockStepInitData } from "./LockStepInitData";
import { PseudoRandom } from "./PseudoRandom";

/// <summary>
/// 帧同步核心
/// </summary>
export class LockStep {

    /// <summary>
    /// 当前多少帧
    /// </summary>
    public currentLogicFrame: number = 0;

    /// <summary>
    /// 当前多少帧
    /// </summary>
    public currentViewFrame: number = 0;

    /// <summary>
    /// 每多少次View帧数,运行一次
    /// </summary>
    public logicFrameScale: number = 0;

    /// <summary>
    /// 当前累计运行时间
    /// </summary>
    private currentTotalTime: number = 0;

    /// <summary>
    /// 下一帧View运行时间
    /// </summary>
    private nextViewFrameTime: number = 0;

    /// <summary>
    /// view每一帧得间隔时间
    /// </summary>
    public viewFrameIntervalTime: number = 0;

    /// <summary>
    /// 游戏世界
    /// </summary>
    public world: World | undefined = undefined;

    /// <summary>
    /// 接收的命令队列
    /// </summary>
    public cmds: { [key: number]: any } = {};

    /// <summary>
    /// 缓存帧命令
    /// </summary>
    public cacheCmds: { [key: number]: any } = {};

    /// <summary>
    /// 缓存帧命令的数量
    /// </summary>
    public cacheNum: number = 0;

    /// <summary>
    /// 伪随机
    /// </summary>
    // public Lockstep.Math.Random pseudoRandom;

    /// <summary>
    /// 游戏是否结束
    /// </summary>
    public isGameOver: boolean = false;

    /// <summary>
    /// 是否等待帧
    /// </summary>
    public isWaitFrame: boolean = false;

    /// <summary>
    /// 是否再追帧
    /// </summary>
    public isChaseFrame: boolean = false;

    /// <summary>
    /// 丢帧后检测此帧是否收到的时间
    /// </summary>
    public lostFrameCheckTime: number = 0;

    /// <summary>
    /// 是否初始化
    /// </summary>
    public isInit: boolean = false;

    /// <summary>
    /// 是否是客户端
    /// </summary>
    public isClient: boolean = false;

    /// <summary>
    /// 伪随机数
    /// </summary>
    private pseudoRandom: PseudoRandom | undefined = undefined;

    /// <summary>
    /// 刷新View层的回调
    /// </summary>
    private updateViewCallBack: Function | undefined = undefined;


    /// <summary>
    /// 初始化
    /// </summary>
    /// <param name="param_currentTotalFrame">当前总共多少帧</param>
    /// <param name="param_seed">随机种子</param>
    /// <param name="param_data">初始化数据</param>
    public Init(data: LockStepInitData, updateViewCallBack?: Function) {
        this.Reset();
        this.world = new World();
        this.world.SetRandomCallback((start: number, end: number) => {
            return this.pseudoRandom?.random(start, end);
        })
        this.pseudoRandom = new PseudoRandom(data.seed);
        this.isInit = true;
        this.updateViewCallBack = updateViewCallBack;
    }

    public Reset() {
        this.isInit = false;
        this.isWaitFrame = false;
        this.isGameOver = false;
        this.currentLogicFrame = 0;
        this.currentViewFrame = 0;
        this.currentTotalTime = 0;
        this.viewFrameIntervalTime = 1.0 / LockStepConst.ViewFrameNum;
        this.logicFrameScale = LockStepConst.LogicFrameScale;
        this.nextViewFrameTime = 0;
        this.cacheNum = 0;
        this.cmds = {};
        this.cacheCmds = {};
        if (this.world != null)
            this.world.Clear();
    }

    /// <summary>
    /// 帧同步核心逻辑
    /// </summary>
    public Update(detailTime: number) {
        if (this.isGameOver) return;

        //如果漏帧，则等待帧补完再走,如果等待缓冲，则也等待帧
        if (this.isWaitFrame) {
            //长时间收不到此帧信息，继续向服务器请求
            this.lostFrameCheckTime += detailTime;
            if (this.lostFrameCheckTime > LockStepConst.LostFrameCheckTime && (this.cacheCmds[this.currentLogicFrame] == null || this.cacheCmds[this.currentLogicFrame] == undefined)) {
                this.QuestLostFrame(this.currentLogicFrame);
                this.lostFrameCheckTime -= LockStepConst.LostFrameCheckTime;
            }
            return;
        }

        this.CheckCmd();

        ////算出逻辑运行累计时间
        this.currentTotalTime += detailTime;

        //当下一帧时间超过当前累计时间说明已经追到最新
        while (this.currentTotalTime > this.nextViewFrameTime) {
            if (this.currentViewFrame % this.logicFrameScale == 0) {
                if (this.GetCmdFormCache(this.currentLogicFrame)) {
                    this.UpdateLogic();
                    ++this.currentLogicFrame;
                } else {
                    this.QuestLostFrame(this.currentLogicFrame);
                    this.isWaitFrame = true;
                    break;
                }
            }
            ++this.currentViewFrame;
            this.nextViewFrameTime += this.viewFrameIntervalTime;
            this.UpdateView();
        }
        this.isChaseFrame = false;
    }

    /// <summary>
    /// 更新逻辑
    /// </summary>
    private UpdateLogic() {
        let cmd = this.cmds[this.currentLogicFrame];
        if (cmd != null) {
            this.world?.TickSystem(cmd);
        }
    }

    /// <summary>
    /// 更新视图
    /// </summary>
    private UpdateView() {
        if (this.updateViewCallBack != null) {
            this.updateViewCallBack();
        }
    }

    /// <summary>
    /// 生成快照
    /// </summary>
    public SnapShot() {
        let snapShotStream: { [key: string]: string[] } = {};
        snapShotStream["entities"] = [];
        //可以将快照存放到内存还是文件中
        if (this.world) {
            for (let i = 0; i < this.world.entities.length; ++i) {
                let entity = this.world.entities[i];
                snapShotStream["entities"][i] = JSON.stringify(entity, ["entityState", "components"]);
            }
        }
        let snapShot = JSON.stringify(snapShotStream);
    }


    /// <summary>
    /// 加载快照
    /// </summary>
    public LoadSnapShot() {
        let snapShotStream : { [key: string]: string[] } = {};
        let entities = snapShotStream["entities"];
        if(this.world)
        {
            for (let i = 0; i <  entities.length; ++i) {
                let entity: Entity = JSON.parse(entities[i]);
                entity.id = i;
                entity.world = this.world;
            }
        }
    }

    /// <summary>
    /// 检测命令是否正确
    /// </summary>
    /// <returns></returns>
    public CheckCmd() {
        this.ChaseFrame();
    }

    /// <summary>
    /// 添加帧事件
    /// </summary>
    public AddCmd(cmds: { frames: { list: { Index: number, cmd: {} }[] } }) {
        //TODO 序号从cmd 中取;
        let frames = cmds.frames;
        if (frames != null && frames.list != null && frames.list.length > 0) {
            for (let i = 0; i < frames.list.length; ++i) {
                let frame = frames.list[i];
                if (frame.Index >= this.currentLogicFrame) {
                    if (this.cacheCmds[frame.Index] == null) {
                        this.cacheCmds[frame.Index] = frame.cmd;
                    } else {
                        this.cacheCmds[frame.Index] = frame.cmd;
                    }
                    ++this.cacheNum;
                }
            }
            //缓冲大于3帧，并且包含当前帧等待结束
            if (this.cacheNum >= LockStepConst.CacheFrameNum && (this.cacheCmds[this.currentLogicFrame] != null || this.cacheCmds[this.currentLogicFrame] != undefined)) {
                this.isWaitFrame = false;
                this.lostFrameCheckTime = 0;
            }
        }
    }

    /// <summary>
    /// 追帧
    /// </summary>
    public ChaseFrame() {
        // 当缓存池大于一定数量促发追帧
        if (this.cacheNum > LockStepConst.ChaseFrameNum) {
            this.isChaseFrame = true;
            let chaseFrame = 0;
            while (this.cacheNum > LockStepConst.CacheFrameNum && (this.cacheCmds[this.currentLogicFrame + chaseFrame] != null || this.cacheCmds[this.currentLogicFrame + chaseFrame] != undefined)) {
                ++chaseFrame;
                if (chaseFrame > LockStepConst.ChaseFrameLimit) {
                    break;
                }
            }
            this.currentTotalTime += this.currentLogicFrame * this.logicFrameScale * (chaseFrame - 1); //游戏总时间调整到要追到的那一帧时间
        }
    }

    /// <summary>
    /// 丢帧需要重载
    /// </summary>
    public QuestLostFrame(index: number) {

    }

    /// <summary>
    /// 从缓存池中拿出数据
    /// </summary>
    /// <param name="index"></param>
    /// <returns></returns>
    public GetCmdFormCache(index: number): boolean {
        if (this.cacheCmds[index] != undefined || this.cacheCmds[index] != null) {
            this.cmds[index] = this.cacheCmds[index];
            this.cacheCmds[index] = null;
            --this.cacheNum;
            return true;
        } else {
            return false;
        }
    }

    /// <summary>
    /// 获取伪随机
    /// </summary>
    /// <returns></returns>
    public GetRandom() {
        return this.pseudoRandom;
    }

    /// <summary>
    /// 获得游戏世界
    /// </summary>
    /// <returns></returns>
    public GetWorld(): World | undefined {
        return this.world;
    }
}
