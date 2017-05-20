import {
  drawSolidCircle,
  drawHollowCircle,
  drawLine,
    distancePoint,
    getCanvasPoint
} from './util.js'

import {defaultOptions} from './config'

export default class Recorder{
  static get ERR_NOT_ENOUGH_POINTS(){
    return "not enough points";
  }
  constructor(options){
    this.options = {...defaultOptions,...options};
    this.render();
  }
  render(){
    let container = this.options.container;
    this.container = container;
    let {width,height} = container.getBoundingClientRect();
    // 画圆的canvas
    let circleCanvas = document.createElement("canvas");
    circleCanvas.width = circleCanvas.height = 2*Math.min(width,height);
    Object.assign(circleCanvas.style,{
      position:"absolute",
      top:"50%",
      left:"50%",
      transform:"translate(-50%,-50%) scale(0.5)"
    });
    // 画固定线条的canvas
    let lineCanvas = circleCanvas.cloneNode();
    // 移动线条的canvas
    let moveCanvas = circleCanvas.cloneNode();

    container.appendChild(lineCanvas);
    container.appendChild(moveCanvas);
    container.appendChild(circleCanvas);
    container.addEventListener('touchstart',(evt)=>{
            evt.preventDefault();
    },{passive:false});
    this.circleCanvas = circleCanvas;
    this.lineCanvas = lineCanvas;
    this.moveCanvas = moveCanvas;

    this.clearPath();
  }

  clearPath(){
        let {circleCanvas,lineCanvas,moveCanvas} =this,
            circleCtx = circleCanvas.getContext("2d"),
            lineCtx = lineCanvas.getContext("2d"),
            moveCtx = moveCanvas.getContext("2d"),
            width = circleCanvas.width,
            {n,fgColor,innerRadius} = this.options,
            range = Math.round(width/(n+1));
        this.circleCtx = circleCtx;
        this.lineCtx = lineCtx;
        this.moveCtx = moveCtx;

        // 三个canvas进行重绘制，然后先重绘九个圆点
        circleCtx.clearRect(0,0,width,width);
        lineCtx.clearRect(0,0,width,width);
        moveCtx.clearRect(0,0,width,width);
        // 绘制九个圆点，并且保存圆点的中心坐标，并把圆点的行列位置进行保存
        let circles  = [];
        for(let i=1;i<=n;i++){
          for(let j=1;j<=n;j++){
            let y= range*i,x = range*j;
            drawSolidCircle(circleCtx,fgColor,x,y,innerRadius)
            let circlePoint = {x,y};
            circlePoint.pos = [i,j];
            circles.push(circlePoint);
          }
        }
        this.circles = circles;
  }
  cancel(){
      this.recordingTask&&this.recordingTask.cancel();
  }
    // record中有异步操作，只有touchend才触发resolve
  record(){
      /*
       这里解决的问题:
       连续调用了两次(或者多次)record(也就是连续绑定两次事件)，但是没有触发事件的回调，
       当第二次(最后一次)record调用之后再触发回调，此时会同时触发两个(多个)回调，
       因此就造成了从原点伸出一条直线的情况(其实是只有一个回调实现了预期效果，其它的回调会造成bug)
       */
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

      /*
       每次touch之前都要进行重绘，因此this.circles总是有九个值
       【注意】:在touchstart之后，多次绑定的事件(touchmove)共用的是同一个this.circles数组
       如果第一个绑定的事件(touchmove)触发回调，满足distance(point, touchPoint) < outerRadius
       条件后就会从this.circles数组中删除该点，因此造成第一个以后绑定的事件(touchmove)触发总是不能满足
       distance(point, touchPoint) < outerRadius条件，最终造成总是有一条线从最初点击的圆圈伸出来
       */
      this.cancel();

      circleCanvas.addEventListener("touchstart",(evt)=>{
         this.clearPath();
      });

      let records = [];
      const handler = (evt)=>{
           //这里用箭头函数，让this指向Recoder对象的实例
           let {clientX,clientY} = evt.touches[0],
               touchPoint = getCanvasPoint(circleCanvas,clientX,clientY);
          /*
           画固定线条、圆圈、移动线条的步骤:
           1.遍历九个点，与touchPoint求距离，如果小于outerRaius，则该点就是手势划过的点，画圆圈
           2.判断密码记录数组有没有值，如果有，取出数组中最后一个值最为画固定线条的起点，第一步中
           遍历到的点作为固定线条的终点
           3.把第一步遍历到的点从this.circles删除并添加到records数组中(用于记录密码的数组)
           4.判断records数组长度，如果大于0，数组中最后一个点作为移动线条的起点，手势移动的点作为终点
           并且在画移动线条的时候要先清除画布，再重绘
           */
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
         /*
          recorder一次以后handeler和done就已经存在了，为了避免连续两次recoder以后出现两条移动线条的bug,
          第二次执行recorder之前必须先删除第一次recoder时添加的事件回调，因此在recorder函数的顶部执行removeEventListener
          删除handler和cancel。
          【注】:得保证删除的handler和done必须和前一次recoder添加的事件回调是同一个函数。

          使用闭包，每recoder一次就产生一个闭包，在闭包中使用removeEventListener移出事件回调
          并且把这个闭包赋值给实例对象的一个属性。由于第一次调用recoder之前没有添加事件回调，因此设置实例属性等于
          一个对象(this.recordingTask = {})，避免第一次调用this.cancel方法时this.recording对象没有cancel方法出现错误。

          闭包：(前一个recoder函数执行完毕以后)把handler和done闭到cancel函数作用域中了
          因此再执行第二个recoder时removeEventListener上次添加的同一个事件回调，最终就会起作用
          */
         circleCanvas.removeEventListener('touchstart', handler);
         circleCanvas.removeEventListener('touchmove', handler);
         circleCanvas.removeEventListener('touchend', done);
     };
      return promise
  }
}
