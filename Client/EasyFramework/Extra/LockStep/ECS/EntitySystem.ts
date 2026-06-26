/**
 * created by SaberZan
 * 帧同步ECS系统
 */

import { World } from "./World";

export class EntitySystem {

    public world: World | undefined = undefined;
    /**
     * 系统优先级，决定哪个系统先运行，越小越先运行
     */
    public priority: number = 0;


    public constructor(world: World) {
        this.world = world;
    }

    /**
     * 这个系统初始化
     * @param world 
     * @param cmd 
    */
    public Init() {


    }

}
