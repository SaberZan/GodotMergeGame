/**
 * created by SaberZan
 * 帧同步静态配置
 */

export let LockStepConst = {

    /// <summary>
    /// 每秒View锁多少帧
    /// </summary>
    ViewFrameNum: 60,

    /// <summary>
    /// 每多少次View帧数运行一次逻辑帧
    /// </summary>
    LogicFrameScale: 2,

    /// <summary>
    /// 缓冲池里面缓存多少帧
    /// </summary>
    CacheFrameNum: 1,

    /// <summary>
    /// 当缓冲池里大于多少帧,促发追帧;
    /// </summary>
    ChaseFrameNum: 10,

    /// <summary>
    /// 追帧每次帧数;
    /// </summary>
    ChaseFrameLimit: 300,

    /// <summary>
    /// 丢帧后检测是否补到帧的最长时间
    /// </summary>
    LostFrameCheckTime: 0.5,

}
