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
            var x = e.pageX - self.currPage.canvas.offsetLeft, y = e.pageY - self.currPage.canvas.offsetTop;
            self.start.call(self, x, y);
        };
        this.mousemove = function (e) {
            var x = e.pageX - self.currPage.canvas.offsetLeft, y = e.pageY - self.currPage.canvas.offsetTop;
            self.move.call(self, x, y);
        };
        this.mouseup = function (e) {
            self.end.call(self);
        };
        this.touchstart = function (e) {
            var x = e.touches[0].pageX - self.currPage.canvas.offsetLeft, y = e.touches[0].pageY - self.currPage.canvas.offsetTop;
            self.start.call(self, x, y);
        };
        this.touchmove = function (e) {
            var x = e.touches[0].pageX - self.currPage.canvas.offsetLeft, y = e.touches[0].pageY - self.currPage.canvas.offsetTop;
            self.move.call(self, x, y);
        };
        this.touchend = function (e) {
            self.end.call(self);
        };
    }
    Tool.prototype.start = function (x, y) { };
    Tool.prototype.move = function (x, y) { };
    Tool.prototype.end = function () { };
    Tool.prototype.addHistory = function (value) {
        if (this.currPage.history.length > this.currPage.historyIndex + 1) {
            // someone has done an undo or more and then made a change, 
            // we need to wipe all their potential redos
            this.currPage.history.splice(this.currPage.historyIndex + 1, this.currPage.history.length);
        }
        this.currPage.historyIndex++;
        this.currPage.history.push({
            toolType: this.type,
            color: this.color,
            width: this.width,
            value: value
        });
    };
    Tool.prototype.redraw = function (value) { };
    Tool.redraw = function (action, page) {
        switch (action.toolType) {
            case ToolType.Pen:
                var tool = new Pen(action.color, action.width);
                tool.currPage = page;
                tool.redraw(action.value);
                break;
        }
    };
    return Tool;
}());
var Pen = /** @class */ (function (_super) {
    __extends(Pen, _super);
    function Pen(color, width) {
        var _this = _super.call(this, ToolType.Pen, color, width) || this;
        _this.moveTo = [];
        return _this;
    }
    Pen.prototype.start = function (x, y) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        this.currPage.ctx.beginPath();
        this.currPage.ctx.moveTo(x, y);
        this.moveTo.push({ x: x, y: y });
        this.started = true;
    };
    Pen.prototype.move = function (x, y) {
        if (this.started) {
            this.currPage.ctx.lineTo(x, y);
            this.currPage.ctx.stroke();
            this.moveTo.push({ x: x, y: y });
        }
    };
    Pen.prototype.end = function () {
        this.currPage.ctx.closePath();
        this.addHistory(this.moveTo);
        this.moveTo = [];
        this.started = false;
    };
    Pen.prototype.redraw = function (value) {
        var moveTo = value;
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        for (var i = 0; i < moveTo.length; i++) {
            var m = moveTo[i];
            if (i === 0) {
                this.currPage.ctx.beginPath();
                this.currPage.ctx.moveTo(m.x, m.y);
            }
            else if (i > 0 && i < (moveTo.length - 1)) {
                this.currPage.ctx.lineTo(m.x, m.y);
                this.currPage.ctx.stroke();
            }
            else {
                this.currPage.ctx.closePath();
            }
        }
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