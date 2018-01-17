var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Tool = /** @class */ (function () {
    function Tool(type, color, width) {
        var self = this;
        this.type = type;
        this.color = color;
        this.width = width;
        this.started = false;
        this.mousedown = function (e) {
            var x = e.pageX - self.currCanvas.offsetLeft, y = e.pageY - self.currCanvas.offsetTop;
            self.start.call(self, x, y);
        };
        this.mousemove = function (e) {
            var x = e.pageX - self.currCanvas.offsetLeft, y = e.pageY - self.currCanvas.offsetTop;
            self.move.call(self, x, y);
        };
        this.mouseup = function (e) {
            self.end.call(self);
        };
        this.touchstart = function (e) {
            var x = e.touches[0].pageX - self.currCanvas.offsetLeft, y = e.touches[0].pageY - self.currCanvas.offsetTop;
            self.start.call(self, x, y);
        };
        this.touchmove = function (e) {
            var x = e.touches[0].pageX - self.currCanvas.offsetLeft, y = e.touches[0].pageY - self.currCanvas.offsetTop;
            self.move.call(self, x, y);
        };
        this.touchend = function (e) {
            self.end.call(self);
        };
    }
    Tool.prototype.start = function (x, y) { };
    Tool.prototype.move = function (x, y) { };
    Tool.prototype.end = function () { };
    return Tool;
}());
var Pen = /** @class */ (function (_super) {
    __extends(Pen, _super);
    function Pen(color, width) {
        return _super.call(this, ToolType.Pen, color, width) || this;
    }
    Pen.prototype.start = function (x, y) {
        this.currCtx.strokeStyle = this.color;
        this.currCtx.lineWidth = this.width;
        this.currCtx.beginPath();
        this.currCtx.moveTo(x, y);
        this.started = true;
    };
    Pen.prototype.move = function (x, y) {
        if (this.started) {
            this.currCtx.lineTo(x, y);
            this.currCtx.stroke();
        }
    };
    Pen.prototype.end = function () {
        this.currCtx.closePath();
        this.started = false;
    };
    return Pen;
}(Tool));
var ToolType;
(function (ToolType) {
    ToolType[ToolType["Pen"] = 0] = "Pen";
    ToolType[ToolType["Line"] = 1] = "Line";
    ToolType[ToolType["Rect"] = 2] = "Rect";
    ToolType[ToolType["Grid"] = 3] = "Grid";
})(ToolType || (ToolType = {}));
//# sourceMappingURL=tools.js.map