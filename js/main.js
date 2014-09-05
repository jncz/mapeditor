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

var paintRect = false;

var targetCanvasRectPoint;

var SrcMapManager = {
	self : null,
	context : null,
	backImageRect : null,
	backPoint : null,
	backSPoint : null,
	backEPoint : null,
	init : function(){
		var canvas = document.getElementById("srcCanvas");
		this.context = canvas.getContext("2d");
		this.self = canvas;
		this.initSrcMap();
		MaskLayer.init();
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
			TargetMapManager.showCurrentLayer();
		});
	},
	rangeStart : null,
	rangeEnd : null,
	enableImageSelect : function(){
		var that = this;
		
		regEvent([this.self,MaskLayer.self],"mousedown",function(e){
			var rectPoint = nearestRectangleByLocation(e,SrcMapManager.self);
			that.rangeStart = rectPoint;
			MaskLayer.hidden();
			paintRect = true;
		});

		regEvent([this.self,MaskLayer.self],"mousemove",function(e){
			var rectPoint = nearestRectangleByLocation(e,SrcMapManager.self);
			if(that.rangeStart && paintRect){
				var pos = getElementPosition(SrcMapManager.self);
				var x = pos[0]+that.rangeStart[0]*unit;
				var y = pos[1]+that.rangeStart[1]*unit;
				var w = unit*(Math.abs(rectPoint[0]-that.rangeStart[0])+1);
				var h = unit*(Math.abs(rectPoint[1]-that.rangeStart[1])+1);
				MaskLayer.show(y,x,w,h);
			}
			
		});
		regEvent([this.self,MaskLayer.self],"mouseup",function(e){
			var rectPoint = nearestRectangleByLocation(e,SrcMapManager.self);
			that.rangeEnd = rectPoint;
			paintRect = false;
			if(that.rangeStart && that.rangeEnd){
				SrcMapManager.selectImageData(that.rangeStart,that.rangeEnd);
				createRect(that.context,that.rangeStart,that.rangeEnd,that.getSelectedImageData(),canvas3,context3);
				showSelectedRange(that.rangeStart,that.rangeEnd,MainFrameManager.srcMapCurrentX,MainFrameManager.srcMapCurrentY);
				enableMetaBtn();
				showSelectedClipAttr(that.rangeStart,MainFrameManager.srcMapCurrentX,MainFrameManager.srcMapCurrentY);
			}
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
	selectImageData : function(spoint,epoint){
		//选中某个单元之后，会在该单元上绘制一个矩形用来标识选择区域，但是当选中其他区域之后，之前的选中的区域中的矩形无法消失
		//所以，变通的方式是，将绘制矩形之前的矩形区域的图形备份，当选择其他区域之后，将之前的选区用备份的图像信息填充
		if(this.backPoint && this.backImageRect){
			if(!this.outofRange(this.backPoint,spoint)){
				this.context.putImageData(this.backImageRect,this.backPoint[0]*unit,this.backPoint[1]*unit);
			}
			
		}

		this.backSPoint = spoint;
		this.backEPoint = epoint;
		if(this.backSPoint && this.backEPoint){
			this.backImageRect = this.context.getImageData(spoint[0]*unit,spoint[1]*unit,(Math.abs(this.backSPoint[0]-this.backEPoint[0])+1)*unit,(Math.abs(this.backSPoint[1]-this.backEPoint[1])+1)*unit);
		}
		
		this.backPoint = spoint;
		
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
		MaskLayer2.init();
		
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
		DataManager.record({layer:currentLayer,point:rectPoint,opt:OPT_REMOVE});
		TargetMapManager.showCurrentLayer();
	},
	paint : function(e){
		var rectPoint = nearestRectangleByLocation(e,canvas2);
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
		regEvent([canvas2,MaskLayer2.self],"dblclick",this.paint);
		regEvent([canvas2],"mousemove",continuesPaintHandler);
	
		removeEvent([canvas2],"mousemove",showTargetRect);
		removeEvent([canvas2,MaskLayer2.self],"click",nonContinuesPaintHandler);
	},
	disableContinuesMode : function(){
		removeEvent([canvas2,MaskLayer2.self],"dblclick",this.paint);
		removeEvent([canvas2],"mousemove",continuesPaintHandler);
		
		regEvent([canvas2],"mousemove",showTargetRect);
		regEvent([canvas2,MaskLayer2.self],"click",nonContinuesPaintHandler);
		this.disableDeleteMode();
	},
	enableDeleteMode : function(){
		removeEvent([canvas2],"mousemove",showTargetRect);
		removeEvent([canvas2],"click",nonContinuesPaintHandler);
		
		regEvent([canvas2],"click",this.clean);
		DeleteBtnManager.enterDeleteMode();
	},
	disableDeleteMode : function(){
		removeEvent([canvas2],"click",this.clean);
		
		//regEvent([canvas2],"mousemove",showTargetRect);
		//regEvent([canvas2],"click",nonContinuesPaintHandler);
		
		DeleteBtnManager.leaveDeleteMode();
	},
	showCurrentLayer : function(){
		this.reset();
		LayerManager.showCurrentLayer();
	},
}

var ToolManager = {
	showAllBtn : null,
	cleanBtn : null,
	mapSrcBtn : null,
	init : function(){
		this.showAllBtn = $("showAllLayer");
		this.cleanBtn = $("cleanMap");
		this.mapSrcBtn = $("setMapSrc");
		this.regEvent();
		
		ContinueBtnManager.init();
		DeleteBtnManager.init();
		MainFrameManager.init();
		MapResizer.init();
		MapExporter.init();
		NewLayer.init();
		MetaManager.init();
		PropEditor.init();
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
		this.cleanBtn.addEventListener("click",function(){
			var result = window.confirm("清除不可逆，确定吗");
			if(result){
				PersistManager.clear("map");
				PersistManager.clear("layer");
				window.location.reload();
			}
		});
		this.mapSrcBtn.addEventListener("click",function(){
			imgPath = $("mapsrc").value;
			SrcMapManager.init();
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
					MaskLayer.hidden();
				}else if(e.keyCode == 38){
					//up
					that.toUp();
					MaskLayer.hidden();
				}else if(e.keyCode == 39){
					//right
					that.toRight();
					MaskLayer.hidden();
				}else if(e.keyCode == 40){
					//down
					that.toDown();
					MaskLayer.hidden();
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

var NewLayer = {
	index : 0,
	self : null,
	init : function(){
		this.self = $("addNewLayer");
		this.regEvent();
		var idx = PersistManager.get("layer");
		this.index = (idx.length == 0)?0:idx;
		this.add();//初始化默认图层
		this.recreateLayer();//创建其他图层
	},
	regEvent : function(){
		var that = this;
		this.self.addEventListener("click",function(){
			that.add();
		});
	},
	add : function(){
		var idx = this.createLayer();
		this.save(idx);
	},
	createLayer : function(){
		var eles = document.getElementsByName("layers");
		var len = eles.length;
		var ele = document.createElement("input");
		ele.type="radio";
		ele.name="layers";
		ele.value = len;
		ele.checked = (len == 0);
		var tnode = document.createTextNode(len+1);
		var parent = document.querySelector(".tools > fieldset");
		parent.insertBefore(ele,$("showAllLayer"));
		parent.insertBefore(tnode,$("showAllLayer"));
		
		LayerManager.regEvent();
		return len;
	},
	save : function(idx){
		PersistManager.save("layer",{data:idx});
	},
	recreateLayer : function(){
		for(var i=1;i<=this.index;i++){
			this.createLayer();
		}
	},
}
var DataManager = {
	layerIndex : [],
	data : [],
	init : function(){
		this.data = PersistManager.get("map");
		
		var idx = PersistManager.get("layer");
		if(idx.length==0){
			return;
		}else{
			var index = idx;
			var indexes = [];
			for(var i = 0;i<index;i++){
				indexes.push(i);
			}
			indexes.sort();
			this.layerIndex = indexes;
		}
	},
	addLayer : function(layer){
		layer = 1*layer;//convert to number
		if(!this.layerExist(layer)){
			this.layerIndex.push(layer);
			if(this.data.length>layer){
				var d = this.data[layer];
				if(!d){
					this.data.push([]);
				}
			}else{
				this.data.push([]);
			}
			
			PersistManager.save("layer",{data:layer});
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
				this.data[idx].push({point:[input.point[0],input.point[1]],imgPoint:[input.srcMapPoint[0],input.srcMapPoint[1]]});
			}
			
			PersistManager.save("map",{data:this.data});
	},
	remove : function(input){
		var layer = input.layer;
		layer = 1*layer;//convert to number
		var idx = this.layerIndex.indexOf(layer);
		if(idx != -1){
			var datas = this.data[idx];
			var foundIdx = -1;
			for(var i=datas.length-1;i>=0;i--){//从后往前删除，最后加入的先删除，这样当有多层覆盖的时候，最表面的先被删掉
				if(datas[i].point[0] == input.point[0] && datas[i].point[1] == input.point[1]){
					foundIdx = i;
					break;
				}
			}
			if(foundIdx != -1){
				datas.splice(foundIdx,1);
			}
			PersistManager.save("map",{data:this.data});
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
	meta:[{point:[x,y],attr:{cross:true,jump:false,..}},..,..]
}
*/
var MapExporter = {
	self : null,
	init : function(){
		this.self = $("exportMap");
		this.regEvent();
		DataConsole.init();
	},
	regEvent : function(){
		var that = this;
		this.self.addEventListener("click",function(){
			that.exportMap();
		});
	},
	computeImgBound : function(metas){
		//TODO
		/**
		@param idx 表示列的号码
		返回的数据格式为：[[255,200,240,255],[...],...]
		*/
		var getLineDataV = function(data,idx){
			//return [[255,200,240,255],[...],...];
			var d = [];
			for(var i = 0;i<unit;i++){
				d.push([data[i*unit*4+idx*4],data[i*unit*4+1+idx*4],data[i*unit*4+2+idx*4],data[i*unit*4+3+idx*4]]);
			}
			return d;
		};
		var getLineDataH = function(data,idx){
			//return [[255,200,240,255],[...],...];
			var d = [];
			for(var i = 0;i<unit;i++){
				d.push([data[i*4+idx*unit*4],data[i*4+1+idx*unit*4],data[i*4+2+idx*unit*4],data[i*4+3+idx*unit*4]]);
			}
			return d;
		};
		/**
		@ldata 每行的数据
		返回该行数据中有效的像素，所谓有效像素是指透明度不为0的像素
		*/
		var findValidPixel = function(ldata){
			for(var i=0;i<ldata.length;i++){
				var d = ldata[i];
				var alpha = d[3];
				if(alpha > 5){//alpha 小于5就认为完全透明
					return d;
				}
			}
			return null;
		}
		for(var i=0;i<metas.length;i++){
			var p = metas[i].point;
			var ctx = SrcMapManager.context;
			var imgData = ctx.getImageData(p[0]*unit,p[1]*unit,unit,unit);
			//var imgData = ctx.getImageData(2*unit,0*unit,unit,unit);
			var data = imgData.data;
			//prettyPrint(data);
			
			var l = r = u = d = unit;
			for(var j = 0;j<unit;j++){
				var ldata = getLineDataV(data,j);//获取左起第j列的数据
				var pixel = findValidPixel(ldata);
				if(!pixel){
					//如果找不到有效像素继续向右推进，取下一列的数据检查是否有有效像素
					continue;
				}else{
					l = j;//表示在第几个像素找到的
					//console.log(" - "+l);
					break;
				}
			}
			
			for(var j = unit-1;j>=0;j--){
				var ldata = getLineDataV(data,j);//获取右起第j列的数据
				var pixel = findValidPixel(ldata);
				if(!pixel){
					//如果找不到有效像素继续向左推进，取下一列的数据检查是否有有效像素
					continue;
				}else{
					r = j;//表示在第几个像素找到的
					break;
				}
			}
			for(var j = 0;j<unit;j++){
				var ldata = getLineDataH(data,j);//获取上往下起第j列的数据
				var pixel = findValidPixel(ldata);
				if(!pixel){
					//如果找不到有效像素继续向下推进，取下一行的数据检查是否有有效像素
					continue;
				}else{
					u = j;//表示在第几个像素找到的
					break;
				}
			}
			for(var j = unit-1;j>=0;j--){
				var ldata = getLineDataH(data,j);//获取下边起第j列的数据
				var pixel = findValidPixel(ldata);
				if(!pixel){
					//如果找不到有效像素继续向上推进，取下一行的数据检查是否有有效像素
					continue;
				}else{
					d = j;//表示在第几个像素找到的
					break;
				}
			}
			
			metas[i].bound = [l,u,r,d];
			//metas[i].bound = [l,0,0,0];
		}
		
		return metas;
	},
	exportMap : function(){
		var layers = [];
		var ds = DataManager.data;
		for(var i=0;i<ds.length;i++){//layer
			var points = ds[i];
			var layer = {
						layerIdx:DataManager.layerIndex[i],
						points:points,	
					};
			layers.push(layer);
		}
		var meta = MetaManager.data;
		meta = this.computeImgBound(meta);
		var jsonobj = {
						width:canvas2.width,
						height:canvas2.height,
						unit:unit,
						srcMap:imgPath,
						layers:layers,
						meta:meta
						};
		DataConsole.show(JSON.stringify(jsonobj));//TODO
	},
}

var DataConsole = {
	self : null,
	dataEle : null,
	closeBtn : null,
	init : function(){
		this.self = $("dataconsole");
		this.dataEle = $("exporteddata");
		this.closeBtn = $("consoleCloseBtn");
		this.regEvent();
	},
	regEvent : function(){
		var that = this;
		this.closeBtn.addEventListener("click",function(){
			that.hide();
		});
		
	},
	show : function(data){
		this.dataEle.innerHTML = data;
		this.self.className = "showDataConsole";
		var xy = getElementPositionBaseViewPort(canvas2);
		this.self.style.top = xy[1];
		this.self.style.left = xy[0];
	},
	hide : function(){
		this.self.className = "hiddenDataConsole";
	},
}

var MaskLayer = {
	self : null,
	init : function(){
		this.self = $("maskLayer");
		this.regEvent();
	},
	regEvent : function(){
		
	},
	show : function(t,l,w,h){
		this.self.className = "showMaskLayer";
		this.self.style.width = w;
		this.self.style.height = h;
		this.self.style.top = t;
		this.self.style.left = l;
	},
	hidden : function(){
		this.self.className = "hiddenMaskLayer";
	},
}

var MaskLayer2 = {
	self : null,
	init : function(){
		this.self = $("maskLayer2");
		this.regEvent();
	},
	regEvent : function(){
		
	},
	show : function(t,l,w,h){
		this.self.className = "showMaskLayer";
		this.self.style.width = w;
		this.self.style.height = h;
		this.self.style.top = t;
		this.self.style.left = l;
	},
	hidden : function(){
		this.self.className = "hiddenMaskLayer";
	},
}

var PropEditor = {
	btn : null,
	cbtn : null,
	self : null,
	cross  : null,
	init : function(){
		this.btn = $("editProp");
		this.cbtn = $("closePropEditor");
		this.self = $("propEditor");
		
		this.regEvent();
	},
	regEvent : function(){
		var that = this;
		regEvent([this.btn],"click",function(){
			that.show();
		});
		regEvent([this.cbtn],"click",function(){
			that.hide();
		});
	},
	show : function(){
		var xy = getElementPositionBaseViewPort(canvas2);
		this.self.className = "showPropEditor";
		this.self.style.top = xy[1];
		this.self.style.left = xy[0];
	},
	hide:function(){
		this.self.className = "hiddenPropEditor";
	},
}

var MetaManager = {
	data : [],//data format: [{point:[x,y],attr:{cross:true,jump:true,..,..}},..,..]
	init : function(){
		this.data = PersistManager.get("mapmeta");
		this.regEvent();
	},
	regEvent : function(){
		var btn = $("saveMeta");
		var selectedEle = $("selectedElement");
		var that = this;
		btn.addEventListener("click",function(){
			var spoint = [selectedEle.getAttribute("minX"),selectedEle.getAttribute("minY")];
			var epoint = [selectedEle.getAttribute("maxX"),selectedEle.getAttribute("maxY")];
			var c = $("cross").checked;
			var j = $("jump").checked;
			
			
			for(var i = spoint[0];i<=epoint[0];i++){//x
				for(var x = spoint[1];x<=epoint[1];x++){//y
					var attr = {cross:c,jump:j};
					var point = [i,x];
					that.save(point,attr);
				}
			}
			
		});
	},
	save : function(point,attr){
		var d = this.get(point);
		if(d){
			d.attr = attr;//update
		}else{
			this.data.push({point:point,attr:attr});
		}
		PersistManager.save("mapmeta",{data:this.data});
	},
	get  : function(point){
		for(var i = 0;i<this.data.length;i++){
			var d = this.data[i];
			var p = d.point;
			if(p[0] == point[0] && p[1] == point[1]){
				return d;
			}
		}
		return null;
	},
}

var PersistManager = {
	store : null,
	init : function(){
		this.store = localStorage;
	},
	save : function(ns,obj){
		this.store[ns] = JSON.stringify(obj);
	},
	clear : function(ns){
		this.store.removeItem(ns);
	},
	get : function(ns){
		var d = this.store[ns];
		if(d){
			var o = JSON.parse(d);
			if(o.data){
				return o.data;
			}
		}
		return [];
	},
}

var continuesPaintHandler = function(e){
					if(!paintStarted){
						return;
					}
					//
					var rectPoint = nearestRectangleByLocation(e,canvas2);
					var pos = getElementPosition(canvas2);
					var x = pos[0]+rectPoint[0]*unit;
					var y = pos[1]+rectPoint[1]*unit;
					var w = unit*(Math.abs(SrcMapManager.rangeEnd[0]-SrcMapManager.rangeStart[0])+1);
					var h = unit*(Math.abs(SrcMapManager.rangeEnd[1]-SrcMapManager.rangeStart[1])+1);
					
					MaskLayer2.show(y,x,w,h);
					//END
					convertImageDataToCanvas(SrcMapManager.getSelectedImageData(),canvas3,context3);
					context2.drawImage(canvas3,rectPoint[0]*unit,rectPoint[1]*unit);
					
					recordMultipleClip(rectPoint);
				};
				
var nonContinuesPaintHandler = function(e){
			var rectPoint = targetCanvasRectPoint;
			convertImageDataToCanvas(SrcMapManager.getSelectedImageData(),canvas3,context3);
			context2.drawImage(canvas3,rectPoint[0]*unit,rectPoint[1]*unit);
			var srcMapPoint = [];
			//FIXME
			if(!SrcMapManager.backSPoint || !SrcMapManager.backEPoint){
				return;
			}
			
			recordMultipleClip(rectPoint);
		};
	
var showTargetRect = function(e){
			var rectPoint = nearestRectangleByLocation(e,canvas2);
			var pos = getElementPosition(canvas2);
			var x = pos[0]+rectPoint[0]*unit;
			var y = pos[1]+rectPoint[1]*unit;
			var w = unit*(Math.abs(SrcMapManager.rangeEnd[0]-SrcMapManager.rangeStart[0])+1);
			var h = unit*(Math.abs(SrcMapManager.rangeEnd[1]-SrcMapManager.rangeStart[1])+1);
			targetCanvasRectPoint = rectPoint;
			MaskLayer2.show(y,x,w,h);
		};
function recordMultipleClip(rectPoint){
	var maxX = Math.max(SrcMapManager.backSPoint[0],SrcMapManager.backEPoint[0]);
	var minX = Math.min(SrcMapManager.backSPoint[0],SrcMapManager.backEPoint[0]);
	var maxY = Math.max(SrcMapManager.backSPoint[1],SrcMapManager.backEPoint[1]);
	var minY = Math.min(SrcMapManager.backSPoint[1],SrcMapManager.backEPoint[1]);
	
	for(var x = minY;x<=maxY;x++){
		var temp = rectPoint[0];
		for(var i = minX;i<=maxX;i++){
			srcMapPoint = [i+MainFrameManager.srcMapCurrentX,x+MainFrameManager.srcMapCurrentY];
			
			DataManager.record({layer:currentLayer,point:rectPoint,srcMapPoint:srcMapPoint,opt:OPT_ADD});
			rectPoint[0] = rectPoint[0]+1;
		}
		rectPoint[1] = rectPoint[1]+1;
		rectPoint[0] = temp;//X到头之后，重新回到前面
	}
}