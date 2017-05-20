> 之前一直都在用框架写东西，也没造过什么轮子，所以一直想用原生JS写点什么东西，无奈自己水平又有限，因此只能上网找别人造好的轮子，然后自己研究。本项目并非原创，只是作为一个学习的案例。本篇文章用来记录自己对该项目的学习总结。

#### 一.声明：
* 本项目全都使用`es6/es7`语法进行编写，并且使用了多页面开发环境进行打包编译。因此可以作为前端进阶的一个项目，如果你是新手建议去[这里](https://www.w3cplus.com/)
* 原项目文章写的非常好，组件编写的流程说的很清楚，详情见[原项目地址](https://www.h5jun.com/post/handlock-comp.html)
* 自己改(zhao)造(chao)的[项目地址](https://github.com/elva2596/HandLocker) (带有大量注释)
* 原文涉及到的在这里就不再提了，本文主要提及一些原文中没有说到的东西
* 在看本篇文章之前，先看原项目
* 本文只是自己对项目源码的理解，如有不对，请及时指出
* 多页面开发环境的使用方法见[这里](https://github.com/MeCKodo/vue-multipage)
* [演示地址](https://elva2596.github.io/ife-tasks/public/views/locker/index.html) 仅支持移动端

#### 二.知识点
###### 1. change事件
先看MDN上的介绍：
* ###### 规范 [HTML5](http://www.whatwg.org/specs/web-apps/current-work/multipage/common-input-element-attributes.html#event-input-change)
* ###### 接口 [Event](https://developer.mozilla.org/zh-CN/docs/Web/API/Event)
* ###### 冒泡 Yes
* ###### 可取消 No
* ###### 目标 Element
* ###### 默认行为 undefined

从上述介绍来看，`change`事件可以冒泡，因此可以对表单元素使用事件代理，先看一段代码:
```
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Document</title>
</head>
<body>
	<div id="handler">
		<label>
			<input type="radio" name="mode" value="check"  id="checkmode">
			验证密码
		</label>
		<label>
			<input type="radio" name="mode" value="update" checked>
			设置密码
		</label>
	</div>
	<script type="text/javascript">
		var handler = document.querySelector("#handler");
		var checkmode = document.querySelector("#checkmode")
		handler.addEventListener("change",function (){
			console.log("success");
		})
		setTimeout(function (){
			checkmode.checked = 'checked'
		},2000)
	</script>
</body>
</html>
```
这段代码的意思是：一开始让设置密码单选按钮被选中，2s之后再让验证密码按钮选中，触发`change事件`，这里`change`事件是被代理的。经过测试你会发现:两秒后验证密码单选按钮被选中，但是`change`事件回调没有被触发，WTF?。原来是这么回事，再看MDN上的一段描述：

 事件触发取决于表单元素的类型（type）和用户对标签的操作:
 1.`<input type="radio">` 和 `<input type="checkbox">` 的默认选项被修改时（通过点击或者键盘事件）;
 2.当用户完成提交动作时 (例如：点击了` <select>`中的一个选项，从 `<input type="date">`标签选择了一个日期，通过 `<input type="file">`标签上传了一个文件，等 );
 3.当标签的值被修改并且失焦后，但并未进行提交 (例如：对`<textarea> `或者`<input type="text">`的值进行编辑后。).

`checkmode.checked = 'checked'`触发了验证密码单选按钮的`change`事件，但是没有发生冒泡，只有单选按钮的鼠标事件或者键盘事件被触发时，`change`事件才会冒泡。因此解决办法是使用`click`方法:
```
click方法可以用来模拟鼠标左键单击一个元素。
当在支持click方法的元素上使用该方法时会触发该元素的 click 事件

checkmode.click()
```
###### 2.实现一个高度随宽度自适应的正方形
```
使用margin或者padding
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Document</title>
	<style type="text/css">
		#container{
			width: 400px;
		}
		#main{
			width: 100%;
			padding-bottom: 100%;
			height: 0;
			background: red;
		}
	</style>
</head>
<body>
	<div id="container">
		<div id="main"></div>
	</div>
</body>
</html>
```
###### 3.touch事件取消默认行为

```
container.addEventListener('touchstart',(evt)=>{
            evt.preventDefault();
    },{passive:false})
```

`passive`的默认值是`false`,当`passive=true`表示 `listener `永远不会调用 `preventDefault()`。如果` listener `仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。

#### 三. 实现细节:
###### 1.状态切换
先上一张图:
![](http://upload-images.jianshu.io/upload_images/2214561-3af78586363183a9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

三种状态之间进行切换:
1. 验证密码状态：如果验证的密码不足四位(四个圆圈)或者与设置的不匹配则再次返回验证密码状态
2. 第一次设置密码状态：如果验证的密码不足四位(四个圆圈)则再次返回第一次设置密码状态，否则进行第二次重复密码设置
3. 第二次重复设置密码状态：如果验证的密码不足四位(四个圆圈)或者与第一次设置的不匹配则再次返第一次设置密码状态，否则转移到验证密码状态


```
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

```
###### 2. 解读`Recoder`父类中的`record`方法
`record`方法中主要有`touchstart`、`touchmove`和`touchend`三个事件的回调函数.并且`record`是一个异步的操作，因此调用的时候要在`async/await`中调用。
*  `handler`(touchstart和touchmove的事件回调)主要用来画固定线条、圆圈和移动线条。详情见下面的注释

```
let handler = evt => { 
      let {clientX, clientY} = evt.changedTouches[0],
          {bgColor, focusColor, innerRadius, outerRadius, touchRadius} = options,
          touchPoint = getCanvasPoint(moveCanvas, clientX, clientY);
      /*
          画固定线条、圆圈、移动线条的步骤:
            1.遍历九个点，与touchPoint求距离，如果小于outerRaius，则该点就是手势划过的点，画圆圈
            2.判断密码记录数组有没有值，如果有，取出数组中最后一个值最为画固定线条的起点，第一步中
              遍历到的点作为固定线条的终点
            3.把第一步遍历到的点从this.circles删除并添加到records数组中(用于记录密码的数组)
            4.判断records数组长度，如果大于0，数组中最后一个点作为移动线条的起点，手势移动的点作为终点
              并且在画移动线条的时候要先清除画布，再重绘            
       */
      for(let i = 0; i < this.circles.length; i++){
        let point = this.circles[i],
            x0 = point.x,
            y0 = point.y;
        if(distance(point, touchPoint) < outerRadius){
          drawSolidCircle(circleCtx, bgColor, x0, y0, outerRadius);//画一个空白的实心圆
          drawSolidCircle(circleCtx, focusColor, x0, y0, innerRadius);//画一个红色实心圆
          drawHollowCircle(circleCtx, focusColor, x0, y0, outerRadius);//画一个空心圆，边框是红色的
          if(records.length){
            let p2 = records[records.length - 1],
                x1 = p2.x,
                y1 = p2.y;
            drawLine(lineCtx, focusColor, x1, y1, x0, y0);
          }

          let circle = this.circles.splice(i, 1);
          records.push(circle[0]);
          break;
        }
      }

      /*
            手势在移动的时候直线跟着逐渐伸长
       */
      if(records.length){
        let point = records[records.length - 1],
            x0 = point.x,
            y0 = point.y,
            x1 = touchPoint.x,
            y1 = touchPoint.y;

        moveCtx.clearRect(0, 0, moveCanvas.width, moveCanvas.height);
        drawLine(moveCtx, focusColor, x0, y0, x1, y1);        
      }

    };
    circleCanvas.addEventListener('touchstart', handler);
    circleCanvas.addEventListener('touchmove', handler);
```

* `done`主要用来移出事件回调并且`resolve`异步操作的结果,因为主要是`touchend`决定了异步操作的结果，因此把`done`方法封装在了一个`promise`中

```
    let done;
    // 异步操作的结束取决于什么时候touchend
    let promise = new Promise((resolve, reject) => {
      done = evt => {
        moveCtx.clearRect(0, 0, moveCanvas.width, moveCanvas.height);
        if(!records.length) return;//点击空白处不执行下面
        circleCanvas.removeEventListener('touchstart', handler);
        circleCanvas.removeEventListener('touchmove', handler);
        circleCanvas.removeEventListener('touchend', done);
        let err = records.length < options.minPoints ? Recorder.ERR_NOT_ENOUGH_POINTS : null;
        //这里可以选择一些复杂的编码方式，本例子用最简单的直接把坐标转成字符串
        let res = {err, records: records.map(o => o.pos.join('')).join('')};
        resolve(res);
      };
      circleCanvas.addEventListener('touchend', done);
    });
```
###### 3.难点解析
先来一张效果图:
![](http://upload-images.jianshu.io/upload_images/2214561-48512a7ac8bdfe6d.gif?imageMogr2/auto-orient/strip)

###### 如图所示：

一开始单选按钮处于验证密码，我们没有进行任何绘制操作，当点击设置密码进行操作时会多出一条来自最开始点击的圆圈的射线。
这是因为，一开始处于验证密码状态时，调用了`check`方法，而`check`方法中调用了`record`,而每`record`一次就会给`canvas`绑定事件回调,这样当点击设置密码进行绘制时，先调用了`update`方法,`update`又调用了一次`record`，当绘制的时候其实是执行了两次事件回调，并且两次事件回调用的是同一个`circles`数组，所以其中一个回调在执行的时候`circles`数组中一直只有一项，这样就造成了多出一条射线。
###### 解决办法：
在每次`record`方法执行前先移除上一次`record`给`canvas`绑定的事件回调，但是怎么在本次`record`方法中移出上一次`record`方法中绑定的事件回调呢？
那就是在`record`方法的底部使用一个闭包,在闭包中使用`removeEventListener`,这样就可以把`handler`和`done`“闭起来”，并且把这个闭包赋值给一个实例属性(是个对象),这样当`record`的时候就可以移除上次`record`添加的事件回调。

```
cancel(){
    this.recordingTask&&this.recordingTask.cancel();
}

record(){
       let {
           circleCanvas,
           moveCanvas,
           circleCtx,
           lineCtx,
           moveCtx,
           options
       } = this;

       let {
           focusColor,
           bgColor,
           innerRadius,
           outerRadius,
           minPoint
       } = options;

      this.cancel();

      circleCanvas.addEventListener("touchstart",(evt)=>{
         this.clearPath();
      });

      let records = [];
      const handler = (evt)=>{
           let {clientX,clientY} = evt.touches[0],
               touchPoint = getCanvasPoint(circleCanvas,clientX,clientY);
           for(let i=0;i<this.circles.length;i++){
               let point = this.circles[i];
               let x0 = point.x,
                   y0 = point.y;
               if(distancePoint(point,touchPoint)<outerRadius){
                   drawSolidCircle(circleCtx,bgColor,x0,y0,outerRadius);
                   drawSolidCircle(circleCtx,focusColor,x0,y0,innerRadius);
                   drawHollowCircle(circleCtx,focusColor,x0,y0,outerRadius);
                   if(records.length){
                       let p2 = records[records.length-1],
                           x1 = p2.x,
                           y1 = p2.y;
                       drawLine(lineCtx,focusColor,x1,y1,x0,y0);
                   }
                   let circle = this.circles.splice(i,1);
                   records.push(circle[0])
                   break;
               }
           }

           if(records.length){
               let point  = records[records.length-1],
                   x0 = point.x,
                   y0 = point.y,
                   x1 = touchPoint.x,
                   y1 = touchPoint.y;
               moveCtx.clearRect(0,0,moveCanvas.width,moveCanvas.height)
               drawLine(moveCtx,focusColor,x0,y0,x1,y1)
           }
      };

     circleCanvas.addEventListener('touchstart',handler);
     circleCanvas.addEventListener('touchmove',handler);
     let done;
      // 异步操作的结束取决于什么时候touchend
     let promise  = new Promise(resolve=>{
         done = ()=>{
             moveCtx.clearRect(0,0,moveCanvas.width,moveCanvas.height);
             if(!records.length) return ;
             circleCanvas.removeEventListener('touchstart', handler);
             circleCanvas.removeEventListener('touchmove', handler);
             circleCanvas.removeEventListener('touchend', done);
             let err = records.length<minPoint?Recorder.ERR_NOT_ENOUGH_POINTS:null;
             let res = {err,records:records.map(item=>item.pos.join('')).join('')};
             resolve(res)
         };
         circleCanvas.addEventListener('touchend',done);
     });
     this.recordingTask = {};
     this.recordingTask.cancel = ()=>{
         circleCanvas.removeEventListener('touchstart', handler);
         circleCanvas.removeEventListener('touchmove', handler);
         circleCanvas.removeEventListener('touchend', done);
     };
      return promise
  }
```
【注】：` this.recordingTask = {};`的目的是避免第一次`record`的时候`cancel`方法不存在
#### 使用方法:
```
1. git clone https://github.com/elva2596/HandLocker.git
2. npm install
3. npm run dev
```