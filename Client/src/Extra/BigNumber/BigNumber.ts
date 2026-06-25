/**
 * created by SaberZan
 * 科学计数法数值对象
 */

import { BindSerialize } from "../Serialize/BindSerialize";

//单位
const UNIT_TYPE = ["", "K", "M", "B", "T"];
const SUB_UNIT_TYPE = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
//准确度
const exact = 5;

@BindSerialize("BigNumber")
export default class BigNumber {

    private value: number = 0;
    private length: number = 0;

    public constructor(value: number | string = 0) {
        this.initialize(value)
    }

    /**
     * //初始化对象
     * @param {String | Int} n     10.2e+8 | 2
     */
    private initialize(value: string | number) {
        let tmp = value + '';
        if (tmp.indexOf("e") != -1 || tmp.indexOf("E") != -1) {
            tmp = tmp.replace("E", "e");
            let tmps1 = tmp.split('e');
            this.value = Math.round(parseFloat(tmps1[0]) * Math.pow(10, exact));
            let op = tmps1[1].substr(0, 1) == "+" ? 1 : -1;
            let extLength = parseInt(tmps1[1].substr(1));
            this.length = op * extLength - exact;
        } else {
            this.value = Math.round(parseFloat(tmp) * Math.pow(10, exact));
            this.length = -exact;
        }
        this._checkValue();
    }


    public static op_add(left: BigNumber, right: BigNumber): BigNumber {
        let tmp = left.clone();
        return tmp.add(right);
    }

    //加法
    public add(number: BigNumber | number) {
        if (number instanceof BigNumber) {
            this._add(number);
        } else {
            let _number = new BigNumber(number);
            this._add(_number);
        }
        return this;
    }

    private _add(number: BigNumber) {
        var dis = this.length - number.length;
        if (dis == 0) {
            this.value = this.value + number.value;
        } else {
            if (dis > 0) {
                if (dis < exact) {
                    this.value = Math.round((this.value + number.value / Math.pow(10, Math.abs(dis))));
                } else {

                }
            } else {
                if (dis > -exact) {
                    this.value = Math.round((this.value / Math.pow(10, Math.abs(dis)) + number.value));
                    this.length = number.length;
                } else {
                    this.value = number.value;
                    this.length = number.length;
                }
            }
        }

        this._checkValue();
    }

    public static op_sub(left: BigNumber, right: BigNumber): BigNumber {
        let tmp = left.clone();
        return tmp.sub(right);
    }

    //减法
    public sub(number: BigNumber | number) {
        if (number instanceof BigNumber) {
            this._sub(number);
        } else {
            let _number = new BigNumber(number);
            this._sub(_number);
        }
        return this;
    }

    private _sub(number: BigNumber) {
        var dis = this.length - number.length;
        if (dis == 0) {
            this.value = this.value - number.value;
        } else {
            if (dis > 0) {
                if (dis < exact) {
                    this.value = Math.round((this.value - number.value / Math.pow(10, Math.abs(dis))));
                } else {

                }
            } else {
                if (dis > -exact) {
                    this.value = Math.round((this.value / Math.pow(10, Math.abs(dis)) - number.value));
                    this.length = number.length;
                } else {
                    this.value = number.value * -1;
                    this.length = number.length;
                }
            }
        }

        this._checkValue();
    }

    public static op_mult(left: BigNumber, right: BigNumber): BigNumber {
        let tmp = left.clone();
        return tmp.mult(right);
    }

    //乘法
    mult(number: BigNumber | number) {
        if (number instanceof BigNumber) {
            this.value = this.value * number.value;
            this.length = this.length + number.length;
        } else {
            this.value = this.value * number;
        }
        this._checkValue();
        return this;
    }

    public static op_divi(left: BigNumber, right: BigNumber): BigNumber {
        let tmp = left.clone();
        return tmp.divi(right);
    }

    //除法
    divi(number: BigNumber | number) {
        if (number instanceof BigNumber) {
            this.value = Math.floor(this.value * 1.0 / number.value * Math.pow(10, exact));
            this.length = this.length - number.length - exact;
        } else {
            this.value = this.value / number;
        }
        this._checkValue();
        return this;
    }


    public static op_compare(left: BigNumber, right: BigNumber): number {
        return left.compare(right);
    }

    /**
     * 比较
     * @param {BigNumber | number} number 
     * @return {Int}  -1|0|1 小于|等于|大于 
     */
    public compare(number: BigNumber): number {
        if (number instanceof BigNumber) {
            return this._compare(number);
        } else {
            let _number = new BigNumber(number);
            return this._compare(_number);
        }
    }

    private _compare(number: BigNumber): number {
        if (this.value >= 0 && number.value < 0) {
            return 1;
        } else if (this.value < 0 && number.value >= 0) {
            return -1;
        } else if (this.value >= 0 && number.value >= 0) {
            if (this.value == 0 && number.value == 0) return 0;

            if (this.length == number.length) {
                if (this.value > number.value) {
                    return 1;
                } else if (this.value == number.value) {
                    return 0;
                } else {
                    return -1;
                }
            } else if (this.length > number.length) {
                return 1;
            } else {
                return -1;
            }
        } else if (this.value < 0 && number.value < 0) {
            if (this.length == number.length) {
                if (this.value > number.value) {
                    return 1;
                } else if (this.value == number.value) {
                    return 0;
                } else {
                    return -1;
                }
            } else if (this.length > number.length) {
                return -1;
            } else {
                return 1;
            }
        }
        return 0;
    }

    /**
     *  检测，确保value 在0-10之间
     * */
    private _checkValue() {
        if (this.value == 0) {
            this.length = -exact;
            return;
        } else if (this.value > 0 && this.value < Math.pow(10, exact) || this.value < 0 && this.value > -Math.pow(10, exact)) {
            this.value = Math.round(this.value * 10);
            this.length -= 1;
        } else if (this.value >= Math.pow(10, exact + 1) || this.value <= -Math.pow(10, exact + 1)) {
            this.value = Math.round(this.value / 10);
            this.length += 1;
        } else {
            return;
        }
        this._checkValue();
    }

    public toString(): string {
        return this.value + "E" + this.length;
    }

    /**
     * 数字转换成字符串
     */
    public toFormatString(): string {
        if (this.value == 0) return "0";

        let num: number;
        if (this.length + exact > 0) {
            num = this.value * Math.pow(10, (this.length + exact) % 3 - exact);
        } else {
            if (this.length + exact < -exact) {
                return "0";
            } else {
                num = this.value * Math.pow(10, this.length);
            }
        }

        let unit: string = '';
        let showNum = (this.length + exact) / 3;
        if (showNum < UNIT_TYPE.length && showNum >= 0)
            unit = UNIT_TYPE[showNum];
        else if (showNum >= UNIT_TYPE.length) {
            showNum = showNum - UNIT_TYPE.length + SUB_UNIT_TYPE.length;
            while (showNum >= SUB_UNIT_TYPE.length) {
                let subindex = showNum % SUB_UNIT_TYPE.length;
                unit = SUB_UNIT_TYPE[subindex] + unit;
                showNum = showNum / SUB_UNIT_TYPE.length - 1;
            }
            unit = SUB_UNIT_TYPE[showNum] + unit;
        }

        if (showNum <= 0) {
            if (num > 1 || num < -1) {
                num = Math.floor(num);
            }
        } else {
            num = Math.floor(num * 10) / 10;
        }

        let strValue = num.toFixed(1) + unit;
        strValue = strValue.replace(".0", "");
        return strValue;
    }

    /**
     * 转换为浮点型 (会有浮点型准确性问题)
     */
    public toFloat(): number {
        return Math.pow(10, this.length) * this.value;
    }

    /**
     * 转换为整形
     */
    public toInt(): number {
        return Math.round(this.toFloat());
    }

    /**
     * 拷贝
     */
    public clone() {
        let newBigNumber = new BigNumber(0);
        newBigNumber.value = this.value;
        newBigNumber.length = this.length;
        return newBigNumber;
    }
}
