OPT_REMOVE = 1;//为DataManager定义两个操作类型
OPT_ADD = 2;

LAYER_ALPHA = 0.3;//非当前图层透明度

function createRect(ctx,spoint,epoint,imgData,tempCanv,tempCtx){
	ctx.save();
	ctx.strokeStyle="#ff0000";
	ctx.fillStyle="#ff0000";
	ctx.lineWidth = 1;

	ctx.globalAlpha = 0.4;

	var x = spoint[0]*unit;
	var y = spoint[1]*unit;
	var w = (Math.abs(epoint[0]-spoint[0])+1)*unit;
	var h = (Math.abs(epoint[1]-spoint[1])+1)*unit;
	
	ctx.clearRect(x,y,w,h);
	ctx.strokeRect(x+1,y+1,w-2,h-2);
	ctx.fillRect(x,y,w,h);
	convertImageDataToCanvas(imgData,tempCanv,tempCtx);
	ctx.restore();
	
	ctx.save();
	ctx.globalAlpha = 0.6;
	ctx.drawImage(tempCanv,0,0,w,h,x,y,w,h);
	ctx.restore();
}

function nearestRectangleByLocation(e,canvas){
	var x = e.x;
	var y = e.y;
	
	var xy = getElementPositionBaseViewPort(canvas);
	var canvasX = xy[0];
	var canvasY = xy[1];
	
	return nearestRectangle(x,y,canvasX,canvasY);
}
//基于当前可视窗口的坐标，故减去滚动出去的部分
function getElementPositionBaseViewPort(ele){
	var x = ele.offsetLeft-document.body.scrollLeft;
	var y = ele.offsetTop-document.body.scrollTop;
	return [x,y];
}

function getElementPosition(ele){
	var x = ele.offsetLeft;
	var y = ele.offsetTop;
	return [x,y];
}
function nearestRectangle(x,y,dx,dy){
	return [Math.floor((x-dx)/unit),Math.floor((y-dy)/unit)];
}

function $(id){
	return document.getElementById(id);
}

function convertImageDataToCanvas(imgData,canv,ctx){
	canv.width = imgData.width;
	canv.height = imgData.height;
	
	ctx.putImageData(imgData,0,0);
}

function regEvent(eles,eventType,listener){
	eles.forEach(function(d,i,a){
		d.addEventListener(eventType,listener);
	});
}