var Compress = {
	text : null,
	obj  : null,
	init : function(str){
		this.text = str;
		this.obj = JSON.parse(str);
	},
	/**
	同样的材质会被压缩
	*/
	compress : function(){
		var layers = this.obj.layers;
		var meta = this.obj.meta;
		this.compressMeta(meta);
		this.compressLayers(layers);
	},
	
	comressMeta : function(meta){
		//TODO
	},
	comressLayers : function(layers){
		//TODO
		var that = this;
		layers.forEach(function(d,i,a){
			var points = d.points;
			that.comressPoints(points);
		});
	},
	comressPoints : function(points){
		//TODO
		points.forEach(function(d,i,a){
			var p = d.point;
			var img = d.imgPoint;
			Map.put(img,p);
		});
		
		var keys = Map.keys();
		keys.forEach(function(d,i,a){
			var p = d.split(",");
			p = [1*p[0],1*p[1]];//将数组中的字符串转换为数字
			var values = Map.get(p);//同一个imgPoint对应的一组point表明这一组坐标点，用的都是同一个材质进行渲染，可压缩
			var range = convertContinuesPointToRange(values);
		});
	},
}
/**
本方法将检查一组坐标点，如果坐标连续，则压缩，压缩方式为:
原始坐标点：[[0,0],[0,1],[0,2]]
从坐标点中可以看出，X坐标为0,切Y坐标连续，所以可以压缩为[0,0,0,2]
例子2：
原始坐标点：
[
[0,0],[0,1],[0,2],
[1,0],[1,1],[1,2],
[2,0],[2,1],[2,2],
]
从坐标可以看出X坐标连续，Y坐标连续，所以可以压缩为[0,0,2,2]
*/
function convertContinuesPointToRange(points){
	var minX = 0;
	var minY = 0;
	var maxX = 0;
	var maxY = 0;
	points.forEach(function(d,i,a){
		var x = d[0];
		var y = d[1];
		maxX = Math.max(maxX,x);
		maxY = Math.max(maxY,y);
		minX = Math.min(minX,x);
		minY = Math.min(minY,y);
	});
	
	var sortedpoints = [];
	for(var i = minY;i<maxY;i++){
		for(var x = minX;x<maxX;x++){
			var key = [x,y].toString();
			points.forEach(function(d,i,a){
				if(key == d.toString()){
					sortedpoints.push(d);
				}
			});
			
		}
	}
	
	
}
var Map = {
	//key, 对于数组来说key是数组的toString()返回值
	keys : function(){
		var keys = [];
		for(var a in this.values){
			if(this.values.hasOwnProperty(a)){
				keys.push(a);
			}
		}
		return keys;
	},
	values : {},
	put : function(key,value){
		var obj = this.get(key);
		if(obj){
			obj.push(value);
		}else{
			var arr = [];
			arr.push(value);
			this.values[key] = arr;
		}
	},
	get : function(key){
		return this.values[key];
	},
	remove : function(key){
		var obj = this.values[key];
		if(obj){
			obj = null;
		}
	},
	clear : function(){
		this.values = {};
	},
}