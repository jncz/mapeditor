var canvas2,context2;
var canvas3,context3;

var imageOffsetX = 0;
var imageOffsetY = 0;

var unit = 32;
var imageViewWidth = unit*9;
var imageViewHeight = unit*18;

var imgPath = "map.png";//图片素材的路径
var srcMap;//原始的图片素材对象

var layerData = [[],[]];

var SrcMapManager = {
	self : null,
	context : null,
	backImageRect : null,
	backPoint : null,
	init : function(){
		var canvas = document.getElementById("srcCanvas");
		this.context = canvas.getContext("2d");
		this.self = canvas;
		this.initSrcMap();
		this.enableImageSelect();
	},
	initSrcMap : function(){
		var p = new Promise(function(resolve,reject){
			var img = new Image();
			img.src = imgPath;
			img.onload=function(){
				if(img.complete==true){
					srcMap = img;
					resolve(1);
				}else{
					reject(-1);
				}
			};
		});
		p.then(function(){
			SrcMapManager.paint();
		});
	},
	enableImageSelect : function(){
		this.self.addEventListener("click",function(e){
				var rectPoint = nearestRectangleByLocation(e,SrcMapManager.self);
				SrcMapManager.selectImageData(rectPoint);
				createRect(SrcMapManager.context,rectPoint);
			});
	},
	selectImageData : function(point){
		//选中某个单元之后，会在该单元上绘制一个矩形用来标识选择区域，但是当选中其他区域之后，之前的选中的区域中的矩形无法消失
		//所以，变通的方式是，将绘制矩形之前的矩形区域的图形备份，当选择其他区域之后，将之前的选区用备份的图像信息填充
		if(this.backPoint && this.backImageRect){
			this.context.putImageData(this.backImageRect,this.backPoint[0]*unit,this.backPoint[1]*unit);
		}
		this.backImageRect = this.context.getImageData(point[0]*unit,point[1]*unit,unit,unit);
		this.backPoint = point;
	},
	getSelectedImageData : function(){
		return this.backImageRect;
	},
	//x,y表示向X或者Y方向变动了几个单位，单位长度有变量unit控制
	paint : function(x,y){
		var x = x || 0;
		var y = y || 0;
		this.context.clearRect(0,0,imageViewWidth,imageViewHeight);
		this.context.drawImage(srcMap,x*unit,y*unit,imageViewWidth,imageViewHeight,0,0,imageViewWidth,imageViewHeight);
	},
}

var TargetMapManager = {
	init : function(){
		canvas2 = document.getElementById("targetCanvas");
		context2 = canvas2.getContext("2d");
		
		canvas3 = document.getElementById("hiddenCanvas");
		context3 = hiddenCanvas.getContext("2d");
		
		this.regEvent();
	},
	regEvent : function(){
			canvas2PaintStart = false;
			canvas2DBLClickHandler = function(e){
											var rectPoint = nearestRectangleByLocation(e,canvas2);
											context2.putImageData(SrcMapManager.getSelectedImageData(),rectPoint[0]*unit,rectPoint[1]*unit);
											canvas2PaintStart = !canvas2PaintStart;
											layerData[0].push(rectPoint);
										 };
			canvas2ClickHandler = function(e){
											var rectPoint = nearestRectangleByLocation(e,canvas2);
											context2.clearRect(rectPoint[0]*unit,rectPoint[1]*unit,unit,unit);
										};
			canvas2.addEventListener("dblclick",canvas2DBLClickHandler);
			
			canvas2.addEventListener("mousemove",function(e){
				if(!canvas2PaintStart){
					return;
				}
				var rectPoint = nearestRectangleByLocation(e,canvas2);
				context2.putImageData(SrcMapManager.getSelectedImageData(),rectPoint[0]*unit,rectPoint[1]*unit);
				layerData[0].push(rectPoint);
			});
	},
	mapResize : function(x,y){
		canvas2.width = x;
		canvas2.height = y;
	},
}

var ToolManager = {
	init : function(){

		this.regEvent();
		
		DeleteBtnManager.init();
		MainFrameManager.init();
		MapResizer.init();
	},
	regEvent : function(){
			
	}
}

var DeleteBtnManager = {
	self : null,
	init : function(){
		this.self = $("deleteClip");
		this.regEvent();
	},
	regEvent : function(){
		this.self.addEventListener("click",function(e){
				if(this.value == "delete"){
					DeleteBtnManager.enterDeleteMode();
				}else{
					DeleteBtnManager.leaveDeleteMode();
				}
			});
	},
	enterDeleteMode : function(){
		//删除模式
		this.self.innerHTML = "离开删除模式";
		this.self.value = "none";
		this.self.className = "redBtn";
		
		//删除模式下，给canvas2注册click事件，同时取消dblclick事件
		canvas2.removeEventListener("dblclick",canvas2DBLClickHandler);
		canvas2.addEventListener("click",canvas2ClickHandler);
	},
	leaveDeleteMode : function(){
		//按钮显示为“进入删除模式”，则当前模式为"非删除模式"
		this.self.innerHTML = "进入删除模式";
		this.self.value = "delete";
		this.self.className = "";
		
		canvas2.addEventListener("dblclick",canvas2DBLClickHandler);
		canvas2.removeEventListener("click",canvas2ClickHandler);
	}
}

var MainFrameManager = {
	self : null,
	srcMapCurrentX : 0,
	srcMapCurrentY : 0,
	init : function(){
		this.self = document.body;
		this.regEvent();
	},
	regEvent : function(){
		this.self.addEventListener("keydown",function(e){
				if(e.keyCode == 37){
					//left
					MainFrameManager.toLeft();
				}else if(e.keyCode == 38){
					//up
					MainFrameManager.toUp();
				}else if(e.keyCode == 39){
					//right
					MainFrameManager.toRight();
				}else if(e.keyCode == 40){
					//down
					MainFrameManager.toDown();
				}
				SrcMapManager.paint(MainFrameManager.srcMapCurrentX,MainFrameManager.srcMapCurrentY);
			});
	},
	toLeft : function(){
		if(this.srcMapCurrentX>0){
			this.srcMapCurrentX--;
		}
	},
	toRight : function(){
		if(this.srcMapCurrentX<((srcMap.width-imageViewWidth)/unit)){
			this.srcMapCurrentX++;
		}
	},
	toUp : function(){
		if(this.srcMapCurrentY>0){
			this.srcMapCurrentY--;
		}
	},
	toDown : function(){
		if(this.srcMapCurrentY<((srcMap.height-imageViewHeight)/unit)){
			this.srcMapCurrentY++;
		}
	},
	
}

var MapResizer = {
	self : null,
	init : function(){
		this.self = $("mapSizer");
		this.regEvent();
	},
	regEvent : function(){
		this.self.addEventListener("click",function(e){
			var x = $("mapSizeX").value;
			var y = $("mapSizeY").value;
			TargetMapManager.mapResize(x,y);
		});
	},
}