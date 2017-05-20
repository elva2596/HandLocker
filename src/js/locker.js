import Recorder from './recorder.js';
import {defaultFunctions} from './config.js'
export default class Locker extends Recorder{
    static get ERR_NOT_MISMATCH(){
        return "not mismath"
    }
    constructor(options){
        options.check = Object.assign({},defaultFunctions.check,options.check);
        options.update = Object.assign({},defaultFunctions.update,options.update);
        /*
         super关键字:
         在子类的构造函数中，只有调用super之后，才可以使用this关键字，否则会报错。
         这是因为子类实例的构建，是基于对父类实例加工，只有super方法才能返回父类实例
         */
        super(options);
    }
    async check(password){
        let checked = this.options.check.checked;
        let res = await this.record();
        if(!res.err&&password!==res.records){
            res.err = Locker.ERR_NOT_MISMATCH
        }
        checked.call(this,res);
        this.check(password);
    }
    async update(){
        let beforeRepeat = this.options.update.beforeRepeat,
            afterRepeat = this.options.update.afterRepeat;
        let first = await this.record();
        beforeRepeat.call(this,first);
        if(first.err){
            return this.update();
        }
        let second = await this.record();
        if(!second.err&&second.records!==first.records){
            second.err = Locker.ERR_NOT_MISMATCH
        }
        afterRepeat.call(this,second);
        this.update();
    }
}
