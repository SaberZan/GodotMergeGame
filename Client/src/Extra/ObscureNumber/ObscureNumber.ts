/**
 * created by SaberZan
 * 防篡改数
 */

import { BindSerialize } from "../Serialize/BindSerialize";

@BindSerialize("ObscureNumber")
export class ObscureNumber {

    private highValue: number = 0;

    private lowValue: number = 0;

    private obscure: number = 0;

    public constructor(v: number = 0){
        this.Value = v;
    }

    set Value(v: number) {
        this.obscure = Math.random() * Number.MAX_SAFE_INTEGER;
        if(Number.isInteger(v)){
            this.highValue = v ^ this.obscure;
            this.lowValue = 0;
        }else{
            let values = v.toString().split('.');
            this.highValue = Number.parseInt(values[0]) ^ this.obscure;
            this.lowValue = Number.parseInt(values[1]) ^ this.obscure;
        }
    }

    get Value(): number {
        if(this.lowValue == 0){
            return this.highValue ^ this.obscure;
        }else{
            let v1 = this.highValue ^ this.obscure;
            let v2 = this.lowValue ^ this.obscure;
            return Number.parseFloat(v1 + "." + v2);
        }
    }

    public ToString(): string {
        return "" + this.Value;
    }

    public Add(n: number | ObscureNumber) : ObscureNumber {
        if (n instanceof ObscureNumber) {
            return new ObscureNumber(this.Value + n.Value);
        }else{
            return new ObscureNumber(this.Value + n);
        }
    }

    public Sub(n: number | ObscureNumber) : ObscureNumber {
        if (n instanceof ObscureNumber) {
            return new ObscureNumber(this.Value - n.Value);
        }else{
            return new ObscureNumber(this.Value - n);
        }
    }

    public Mult(n: number | ObscureNumber) : ObscureNumber {
        if (n instanceof ObscureNumber) {
            return new ObscureNumber(this.Value * n.Value);
        }else{
            return new ObscureNumber(this.Value * n);
        }
    }

    public Divi(n: number | ObscureNumber) : ObscureNumber {
        if (n instanceof ObscureNumber) {
            return new ObscureNumber(this.Value / n.Value);
        }else{
            return new ObscureNumber(this.Value / n);
        }
    }

    public AddSelf(n: number | ObscureNumber) {
        if (n instanceof ObscureNumber) {
            this.Value += n.Value;
        }else {
            this.Value += n;
        }
    }

    public SubSelf(n: number | ObscureNumber) {
        if (n instanceof ObscureNumber) {
            this.Value -= n.Value;
        }else{
            this.Value -= n;
        }
    }

    public MultSelf(n: number | ObscureNumber) {
        if (n instanceof ObscureNumber) {
            this.Value *= n.Value;
        }else{
            this.Value *= n;
        }
    }

    public DiviSelf(n: number | ObscureNumber) {
        if (n instanceof ObscureNumber) {
            this.Value /= n.Value;
        }else{
            this.Value /= n;
        }
    }
}