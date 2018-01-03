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
        this.type = type;
        this.color = color;
        this.width = width;
        this.started = false;
    }
    Tool.prototype.init = function () {
        var self = this, canvas = $('canvas:visible')[0], ctx = canvas.getContext('2d');
        canvas.addEventListener('mousedown', function (e) {
            var x = e.pageX - canvas.offsetLeft, y = e.pageY - canvas.offsetTop;
            self.start(ctx, x, y);
        }, false);
        canvas.addEventListener('mousemove', function (e) {
            var x = e.pageX - canvas.offsetLeft, y = e.pageY - canvas.offsetTop;
            self.move(ctx, x, y);
        }, false);
        canvas.addEventListener('mouseup', function (e) {
            self.end(ctx);
        }, false);
        // Touch Events
        canvas.addEventListener('touchstart', function (e) {
            var x = e.touches[0].pageX - canvas.offsetLeft, y = e.touches[0].pageY - canvas.offsetTop;
            self.start(ctx, x, y);
        }, false);
        canvas.addEventListener('touchmove', function (e) {
            var x = e.touches[0].pageX - canvas.offsetLeft, y = e.touches[0].pageY - canvas.offsetTop;
            self.move(ctx, x, y);
        }, false);
        canvas.addEventListener('touchend', function (e) {
            self.end(ctx);
        }, false);
    };
    Tool.prototype.start = function (ctx, x, y) { };
    Tool.prototype.move = function (ctx, x, y) { };
    Tool.prototype.end = function (ctx) { };
    return Tool;
}());
var Pen = /** @class */ (function (_super) {
    __extends(Pen, _super);
    function Pen(color, width) {
        return _super.call(this, ToolType.Pen, color, width) || this;
    }
    Pen.prototype.start = function (ctx, x, y) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(x, y);
        this.started = true;
    };
    Pen.prototype.move = function (ctx, x, y) {
        if (this.started) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };
    Pen.prototype.end = function (ctx) {
        ctx.closePath();
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