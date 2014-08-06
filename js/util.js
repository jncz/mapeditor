OPT_REMOVE = 1;//为DataManager定义两个操作类型
OPT_ADD = 2;

LAYER_ALPHA = 0.3;//非当前图层透明度

function createRect(ctx,point){
	ctx.save();
	ctx.strokeStyle="#ff0000";
	ctx.lineWidth = 1;
	ctx.strokeRect(point[0]*unit+1,point[1]*unit+1,unit-2,unit-2);
	ctx.restore();
}

function nearestRectangleByLocation(e,canvas){
	var x = e.x;
	var y = e.y;
	
	var canvasX = canvas.offsetLeft-document.body.scrollLeft;
	var canvasY = canvas.offsetTop-document.body.scrollTop;
	
	return nearestRectangle(x,y,canvasX,canvasY);
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