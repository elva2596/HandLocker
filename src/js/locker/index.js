/**
 * Created by 路路 on 2017/5/20.
 */
import {Locker} from '../app.js'
let password = localStorage.getItem('password')||"11121323";
var locker = new Locker({
    container:document.querySelector("#handlock"),
    check:{
        checked(res){
            this.clearPath();
            if(res.err){
                if(res.err===Locker.ERR_NOT_MISMATCH){
                    hint.innerHTML = "密码错误，请重新绘制";
                }else{
                    toast.className = 'show';
                    setTimeout(()=>{
                        toast.className = 'hide';
                    },500)
                }
            }else{
                hint.innerHTML = "密码正确";
            }
        }
    },
    update:{
        beforeRepeat(res){
            this.clearPath();
            if(res.err){
                toast.className = 'show';
                setTimeout(()=>{
                    toast.className = 'hide';
                },500);
            }else{
                hint.innerHTML = "请再次绘制相同的图形";
            }
        },
        afterRepeat(res){
            this.clearPath();
            if(res.err){
                if(res.err===Locker.ERR_NOT_MISMATCH){
                    hint.innerHTML = "两次绘制的图形不一致，请重新绘制";
                }else{
                    hint.innerHTML = "设置密码，请绘制密码图案";
                    toast.className = 'show';
                    setTimeout(()=>{
                        toast.className = 'hide';
                    },500);
                }
            }else{
                hint.innerHTML = "更新成功";
                password = res.records;
                localStorage.setItem("password",password);
                setTimeout(()=>{
                    //click 方法可以用来模拟鼠标左键单击一个元素。
                    checkmode.click();
                },600);
            }
        }
    }
});

/*
 change事件:
 事件触发取决于表格元素的类型（type）和用户对标签的操作:
 1.<input type="radio"> 和 <input type="checkbox"> 的默认选项被修改时（通过点击或者键盘事件）;
 2.当用户完成提交动作时 (例如：点击了 <select>中的一个选项，从 <input type="date">标签选择了一个日期，通过 <input type="file">标签上传了一个文件，等 );
 3.当标签的值被修改并且失焦后，但并未进行提交 (例如：对<textarea> 或者<input type="text">的值进行编辑后。).
 */
selectMode.addEventListener('change',(ev)=>{
    let val = ev.target.value;
    if(val=='check'){
        hint.innerHTML = "验证密码，请绘制密码图案";
        locker.check(password)
    }else if(val=='update'){
        hint.innerHTML = "设置密码，请绘制密码图案";
        locker.update();
    }
});
locker.check("11121323");
