var canvas,context;
var canvas2,context2;
var canvas3,context3;

var SrcMapManager = {
	init : function(){
		canvas = document.getElementById("srcCanvas");
		context = canvas.getContext("2d");
	},
	regEvent : function(){
		canvas.addEventListener("click",function(e){
				var rectPoint = nearestRectangleByLocation(e,canvas);
				selectedImageData(rectPoint);
				createRect(context,rectPoint);
			});
	}
}

var TargetMapManager = {
	init : function(){
		canvas2 = document.getElementById("targetCanvas");
		context2 = canvas2.getContext("2d");
		
		canvas3 = document.getElementById("hiddenCanvas");
		context3 = hiddenCanvas.getContext("2d");
	}
}

var ToolManager = {

}