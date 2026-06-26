import { AudioStream, AudioStreamPlayer2D, Node, Resource, ResourceLoader } from "godot";
import { Singleton } from "../Utils/Singleton";
import { AssetsMgr } from "../Assets/AssetsMgr";
import { LoggerMgr } from "../Logger/LoggerMgr";

export class AudioMgr extends Singleton<AudioMgr> {

    private audioEffects: AudioStreamPlayer2D[] = []

    private audioBGM: AudioStreamPlayer2D | undefined;

    private audioRoot: Node | undefined;

    public async Init(): Promise<boolean> {
        this.audioRoot = new Node("Audio");
        //预加载5个
        this.audioEffects = [];
        for (var i = 0; i < 5; ++i) {
            this.AddEffectNode(i);
        }
        //背景音乐唯一
        this.audioBGM = new AudioStreamPlayer2D("BGM");
        return true;
    }

    private AddEffectNode(id: number) {
        let audioEffect = new AudioStreamPlayer2D("AudioEffect");
        this.audioRoot?.add_child(audioEffect)
        this.audioEffects[id] = audioEffect;
    }

    public PlayEffect(path: string, loop: boolean = false): number {
        if (path == undefined || path == null)
            return 0;

        let sourceId = -1;
        LoggerMgr.Instance().Log("l = " + this.audioEffects.length);
        for (let i = 0; i <= this.audioEffects.length; ++i) {
            if (!this.audioEffects[i].playing) {
                sourceId = i;
                break;
            }
        }
        //没有闲置的节点
        if (sourceId == -1) {
            sourceId = this.audioEffects.length + 1;
            this.AddEffectNode(sourceId);
        }
        let audioClip = ResourceLoader.load(path) as AudioStream;
        this.audioEffects[sourceId].stream = audioClip;
        this.audioEffects[sourceId].play()
        return sourceId;
    }

    public StopEffect(sourceId: number) {
        if (this.audioEffects[sourceId] != undefined || this.audioEffects[sourceId] != null)
            this.audioEffects[sourceId].stop();
    }

    public PlayBGM(path: string) {
        let audioClip = ResourceLoader.load(path) as AudioStream;
        if(this.audioBGM) {
            this.audioBGM.stream = audioClip;
            this.audioBGM.play();
        }
    }

    public StopBGM() {
        if (this.audioBGM != null || this.audioBGM != undefined)
            this.audioBGM.stop();
    }

    public SetEffectMute(mute: boolean) {
        for (var i = 0; i <= this.audioEffects.length; i++) {
            this.audioEffects[i].stream_paused = mute;
        }
    }

    public SetBGMMute(mute: boolean) {
        if(this.audioBGM) {
            this.audioBGM.stream_paused = mute;
        }
    }
}