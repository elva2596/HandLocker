/**
 * Created by 路路 on 2017/5/20.
 */
import {Recorder} from "../app.js"
const recorder = new Recorder({
    container:document.querySelector("#main")
});
const cancelBtn = document.querySelector("#cancel")
const recordBtn = document.querySelector("#record")
function recorded(){
    recorder.record().then(recorded)
}
recordBtn.onclick = function (){
    console.log('record enabled')
    recorder.record().then(recorded)
};
cancelBtn.onclick = function (){
    recorder.cancel();
    recorder.clearPath();
};