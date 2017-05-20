/*
    这些函数应该封装，不对外开放
*/

// 画实心圆
function drawSolidCircle(ctx,color,x,y,r){
  ctx.fillStyle = color;
  ctx.beginPath()
  ctx.arc(x,y,r,0,Math.PI*2,true)
  ctx.fill()
}
// 画空心圆
function drawHollowCircle(ctx,color,x,y,r){
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath()
  ctx.arc(x,y,r,0,Math.PI*2,true);
  ctx.stroke();
}
// 画直线
function drawLine(ctx,color,x1,y1,x2,y2){
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke()
}
//判断两点间的距离
function distancePoint(p1,p2){
  const x = p2.x-p1.x,
        y = p2.y-p1.y;
  return Math.sqrt(x*x+y*y);
}
//获取相对于canvas的坐标
function getCanvasPoint(canvas,x,y){
    // Element.getBoundingClientRect()方法返回元素的大小及其相对于视口的位置
    const p = canvas.getBoundingClientRect()
    return {
        x:2*(x-p.left),
        y:2*(y-p.top)
    }
}
export {
  drawSolidCircle,
  drawHollowCircle,
  drawLine,
    distancePoint,
    getCanvasPoint
}
