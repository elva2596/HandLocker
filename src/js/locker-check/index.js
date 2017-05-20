/**
 * Created by 路路 on 2017/5/20.
 */
import {Locker} from '../app.js'
const locker = new Locker({
    container:document.querySelector("#main"),
    check:{
        checked(res){
            console.log(res)
        }
    }
});
locker.check('11121323');