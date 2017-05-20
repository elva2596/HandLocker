/**
 * Created by 路路 on 2017/5/20.
 */
import {Locker} from '../app.js'
const locker = new Locker({
    container:document.querySelector("#main"),
    update:{
        beforeRepeat(res){
            this.clearPath();
            if(res.err){
                console.error(res.err)
            }else{
                console.log("再输入一次")
            }
        },
        afterRepeat(res){
            this.clearPath();
            if(res.err){
                console.error(res.err)
            }else{
                console.log(res.records)
            }
        }
    }
});
locker.update()