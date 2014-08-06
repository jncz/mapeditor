var canvas2,context2;
var canvas3,context3;

var imageOffsetX = 0;
var imageOffsetY = 0;

var unit = 32;
var imageViewWidth = unit*9;
var imageViewHeight = unit*18;

var imgPath = "map.png";//图片素材的路径
var srcMap;//原始的图片素材对象

var continuesPaintHandler;

var currentLayer = 0;//多层的时候，默认显示的层
var showAllLayer = false;

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
	outofRange : function(point,currentPoint){
		var x = point[0];
		var y = point[1];
		
		if(x >=0 || y >=0){
			return false;
		}
		return true;
	},
	selectImageData : function(point){
		//选中某个单元之后，会在该单元上绘制一个矩形用来标识选择区域，但是当选中其他区域之后，之前的选中的区域中的矩形无法消失
		//所以，变通的方式是，将绘制矩形之前的矩形区域的图形备份，当选择其他区域之后，将之前的选区用备份的图像信息填充
		if(this.backPoint && this.backImageRect){
			if(!this.outofRange(this.backPoint,point)){
				//this.context.putImageData(this.backImageRect,this.backPoint[0]*unit,this.backPoint[1]*unit);
				convertImageDataToCanvas(this.backImageRect,canvas3,context3);
				this.context.drawImage(canvas3,this.backPoint[0]*unit,this.backPoint[1]*unit);
			}
			
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
	targetMapSizeX : 0,
	targetMapSizeY : 0,
	init : function(){
		canvas2 = document.getElementById("targetCanvas");
		context2 = canvas2.getContext("2d");
		this.targetMapSizeX = canvas2.width;
		this.targetMapSizeY = canvas2.height;
		canvas3 = document.getElementById("hiddenCanvas");
		context3 = hiddenCanvas.getContext("2d");
		
		this.regEvent();
		
		LayerManager.init();
	},
	reset : function(){
		context2.clearRect(0,0,this.targetMapSizeX,this.targetMapSizeY);
	},
	regEvent : function(){
			paintStarted = false;
			this.disableContinuesMode();
	},
	clean : function(e){
		var rectPoint = nearestRectangleByLocation(e,canvas2);
		context2.clearRect(rectPoint[0]*unit,rectPoint[1]*unit,unit,unit);
		DataManager.record({layer:currentLayer,point:rectPoint,opt:OPT_REMOVE});
	},
	paint : function(e){
		var rectPoint = nearestRectangleByLocation(e,canvas2);
		//context2.putImageData(SrcMapManager.getSelectedImageData(),rectPoint[0]*unit,rectPoint[1]*unit);
		convertImageDataToCanvas(SrcMapManager.getSelectedImageData(),canvas3,context3);
		context2.drawImage(canvas3,rectPoint[0]*unit,rectPoint[1]*unit);
		paintStarted = !paintStarted;
		DataManager.record({layer:currentLayer,point:rectPoint,srcMapPoint:[SrcMapManager.backPoint[0]+MainFrameManager.srcMapCurrentX,SrcMapManager.backPoint[1]+MainFrameManager.srcMapCurrentY],opt:OPT_ADD});
	},
	mapResize : function(x,y){
		canvas2.width = x;
		canvas2.height = y;
	},
	enableContinuesMode : function(){
		canvas2.addEventListener("dblclick",this.paint);
		continuesPaintHandler = function(e){
					if(!paintStarted){
						return;
					}
					var rectPoint = nearestRectangleByLocation(e,canvas2);
					//context2.putImageData(SrcMapManager.getSelectedImageData(),rectPoint[0]*unit,rectPoint[1]*unit);
					convertImageDataToCanvas(SrcMapManager.getSelectedImageData(),canvas3,context3);
					context2.drawImage(canvas3,rectPoint[0]*unit,rectPoint[1]*unit);
					DataManager.record({layer:currentLayer,point:rectPoint,srcMapPoint:[SrcMapManager.backPoint[0]+MainFrameManager.srcMapCurrentX,SrcMapManager.backPoint[1]+MainFrameManager.srcMapCurrentY],opt:OPT_ADD});
				};
		canvas2.addEventListener("mousemove",continuesPaintHandler);

		canvas2.removeEventListener("click",nonContinuesPaintHandler);
	},
	disableContinuesMode : function(){
		canvas2.removeEventListener("dblclick",this.paint);
		
		if(continuesPaintHandler){
			canvas2.removeEventListener("mousemove",continuesPaintHandler);
		}
		
		nonContinuesPaintHandler = function(e){
			var rectPoint = nearestRectangleByLocation(e,canvas2);
			//context2.putImageData(SrcMapManager.getSelectedImageData(),rectPoint[0]*unit,rectPoint[1]*unit);
			convertImageDataToCanvas(SrcMapManager.getSelectedImageData(),canvas3,context3);
			context2.drawImage(canvas3,rectPoint[0]*unit,rectPoint[1]*unit);
			DataManager.record({layer:currentLayer,point:rectPoint,srcMapPoint:[SrcMapManager.backPoint[0]+MainFrameManager.srcMapCurrentX,SrcMapManager.backPoint[1]+MainFrameManager.srcMapCurrentY],opt:OPT_ADD});
		}
		canvas2.addEventListener("click",nonContinuesPaintHandler);
		this.disableDeleteMode();
		
	},
	enableDeleteMode : function(){
		canvas2.addEventListener("click",this.clean);
		DeleteBtnManager.enterDeleteMode();
	},
	disableDeleteMode : function(){
		canvas2.removeEventListener("click",this.clean);
		DeleteBtnManager.leaveDeleteMode();
	},
	showCurrentLayer : function(){
		this.reset();
		LayerManager.showCurrentLayer();
	},
}

var ToolManager = {
	showAllBtn : null,
	init : function(){
		this.showAllBtn = $("showAllLayer");
		this.regEvent();
		
		ContinueBtnManager.init();
		DeleteBtnManager.init();
		MainFrameManager.init();
		MapResizer.init();
		MapExporter.init();
	},
	regEvent : function(){
		this.showAllBtn.addEventListener("click",function(){
			if(this.checked){
				showAllLayer = true;
			}else{
				showAllLayer = false;
			}
			TargetMapManager.showCurrentLayer();
		});
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
					TargetMapManager.enableDeleteMode();
				}else{
					TargetMapManager.disableDeleteMode();
				}
			});
	},
	enterDeleteMode : function(){
		//删除模式
		this.self.innerHTML = "离开删除模式";
		this.self.value = "none";
		this.self.className = "redBtn";
	},
	leaveDeleteMode : function(){
		//按钮显示为“进入删除模式”，则当前模式为"非删除模式"
		this.self.innerHTML = "进入删除模式";
		this.self.value = "delete";
		this.self.className = "";
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
		var that = this;
		this.self.addEventListener("keydown",function(e){
				if(e.keyCode == 37){
					//left
					that.toLeft();
				}else if(e.keyCode == 38){
					//up
					that.toUp();
				}else if(e.keyCode == 39){
					//right
					that.toRight();
				}else if(e.keyCode == 40){
					//down
					that.toDown();
				}
				SrcMapManager.paint(that.srcMapCurrentX,that.srcMapCurrentY);
			});
	},
	toLeft : function(){
		if(this.srcMapCurrentX>0){
			this.srcMapCurrentX--;
			var p = SrcMapManager.backPoint;
			p[0] = p[0]+1;
		}
	},
	toRight : function(){
		if(this.srcMapCurrentX<((srcMap.width-imageViewWidth)/unit)){
			this.srcMapCurrentX++;
			var p = SrcMapManager.backPoint;
			p[0] = p[0]-1;
		}
	},
	toUp : function(){
		if(this.srcMapCurrentY>0){
			this.srcMapCurrentY--;
			var p = SrcMapManager.backPoint;
			p[1] = p[1]+1;
		}
	},
	toDown : function(){
		if(this.srcMapCurrentY<((srcMap.height-imageViewHeight)/unit)){
			this.srcMapCurrentY++;
			var p = SrcMapManager.backPoint;
			p[1] = p[1]-1;
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

var ContinueBtnManager = {
	self : null,
	init : function(){
		this.self = $("continueModeBtn");
		this.regEvent();
	},
	regEvent : function(){
		var that = this;
		this.self.addEventListener("click",function(e){
				if(this.value == "continues"){
					that.enterContinuesMode();
				}else{
					that.leaveContinuesMode();
				}
			});
	},
	enterContinuesMode : function(){
		//进入连续涂刷模式
		this.self.innerHTML = "离开连续模式";
		this.self.value = "none";
		this.self.className = "redBtn";
		
		TargetMapManager.enableContinuesMode();
	},
	leaveContinuesMode : function(){
		//按钮显示为“进入连续模式”，则当前模式为"非连续模式"
		this.self.innerHTML = "进入连续模式";
		this.self.value = "continues";
		this.self.className = "";
		
		TargetMapManager.disableContinuesMode();
	},	
}

var DataManager = {
	layerIndex : [],
	data : [],
	addLayer : function(layer){
		layer = 1*layer;//convert to number
		if(!this.layerExist(layer)){
			this.layerIndex.push(layer);
			this.data.push([]);
		}
	},
	getByLayer : function(layer){
		layer = 1*layer;//convert to number
		var idx = this.layerIndex.indexOf(layer);
		if(idx != -1){
			return this.data[idx];
		}
		return [];
	},
	/**
	@param param {layer:layerInfo,point:[x,y],opt:OPT_ADD/OPT_REMOVE}
	*/
	record : function(param){
		if(param.opt == OPT_ADD){
			this.add(param);
		}else if(param.opt == OPT_REMOVE){
			this.remove(param);
		}
	},
	add : function(input){
			var layer = input.layer;
			layer = 1*layer;//convert to number
			var idx = this.layerIndex.indexOf(layer);
			if(idx == -1){
				this.layerIndex.push(layer);
				idx = this.layerIndex.length - 1;
				this.data.push([]);
			}
			if(!this.exist(this.data[idx],input)){
				this.data[idx].push({point:input.point,imgPoint:input.srcMapPoint});
			}
			/**
			else{
				for(var i = 0;i<this.data[idx].length;i++){
					var d = this.data[idx][i];
					var p = d.point;
					if(p[0] == input.point[0] && p[1] == input.point[1]){
						d.imgPoint = input.srcMapPoint;
						break;
					}
				}
				
			}
			*/
	},
	remove : function(input){
		var layer = input.layer;
		layer = 1*layer;//convert to number
		var idx = this.layerIndex.indexOf(layer);
		if(idx != -1){
			var datas = this.data[idx];
			var foundIdx = -1;
			for(var i=0;i<datas.length;i++){
				if(datas[i][0] == input.point[0] && datas[i][1] == input.point[1]){
					foundIdx = i;
					break;
				}
			}
			datas.splice(foundIdx,1);
		}
	},
	layerExist : function(layer){
		layer = 1*layer;//convert to number
		return this.layerIndex.indexOf(layer)!=-1;
	},
	exist : function(datas,input){
		for(var i = 0;i<datas.length;i++){
			var d = datas[i];
			var p = d.point;
			var img = d.imgPoint;
			if(p[0] == input.point[0] && p[1] == input.point[1] && input.srcMapPoint[0] == img[0] && input.srcMapPoint[1] == img[1]){
				return true;
			}
		}
		return false;
	},
}

var LayerManager = {
	init : function(){
		this.regEvent();
	},
	regEvent : function(){
		var that = this;
		var nodes = document.getElementsByName("layers");
		
		for(var i=0;i<nodes.length;i++){
			DataManager.addLayer(nodes[i].value);
			nodes[i].addEventListener("click",function(){
				if(this.checked){
					currentLayer = 1*this.value;//make sure the currentLayer is Number
					TargetMapManager.showCurrentLayer();
					that.maskOtherLayers();
				}
			});
		}
	},
	showCurrentLayer : function(){
		for(var i=0;i<DataManager.layerIndex.length;i++){
			var data = DataManager.data[i];
			context2.save();
			context2.globalAlpha = showAllLayer?1:((i == currentLayer)?1:LAYER_ALPHA);
			for(var x = 0;x<data.length;x++){
				var d = data[x];
				var p = d.point;
				var imgPoint = d.imgPoint;
				context2.drawImage(srcMap,imgPoint[0]*unit,imgPoint[1]*unit,unit,unit,p[0]*unit,p[1]*unit,unit,unit);
			}
			context2.restore();
		}
		
	},
	maskOtherLayers : function(){
		//TODO
	},
}


/**
{
	width:100,
	height:100,
	unit:32,
	srcMap:"path",
	layers:[{
				idx:0,
				point:[x,y],
			},..,..],
}
*/
var MapExporter = {
	self : null,
	init : function(){
		this.self = $("exportMap");
		this.regEvent();
	},
	regEvent : function(){
		var that = this;
		this.self.addEventListener("click",function(){
			that.exportMap();
		});
	},
	exportMap : function(){
		console.log(DataManager.data);
	},
}