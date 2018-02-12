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
    Tool.prototype.init = function (currPage) {
        this.currPage = currPage;
        this.currPage.applyListeners(this);
    };
    Tool.prototype.destroy = function () {
        this.currPage.removeListeners(this);
        this.currPage = null;
    };
    Tool.prototype.start = function (x, y) { };
    Tool.prototype.move = function (x, y) { };
    Tool.prototype.end = function () { };
    Tool.prototype.addHistory = function (value, currPageOverride) {
        var page = currPageOverride ? currPageOverride : this.currPage;
        if (page.history.length > page.historyIndex + 1) {
            // someone has done an undo or more and then made a change, 
            // we need to wipe all their potential redos
            page.history.splice(page.historyIndex + 1, page.history.length);
        }
        page.historyIndex++;
        page.history.push({
            toolType: this.type,
            color: this.color,
            width: this.width,
            value: JSON.stringify(value)
        });
    };
    Tool.prototype.redraw = function (value) { };
    Tool.ToolInstance = function (type, color, width) {
        var tool = null;
        switch (type) {
            case ToolType.Pen:
                tool = new Pen(color, width);
                break;
            case ToolType.Line:
                tool = new Line(color, width);
                break;
            case ToolType.Box:
                tool = new Box(color, width);
                break;
            case ToolType.Text:
                tool = new Textbox(color, width);
                break;
            case ToolType.Graph:
                break;
            default:
                break;
        }
        return tool;
    };
    Tool.redraw = function (action, page) {
        var tool = Tool.ToolInstance(action.toolType, action.color, action.width);
        tool.currPage = page;
        tool.actualPage = page;
        tool.redraw(JSON.parse(action.value));
    };
    return Tool;
}());
var Pen = /** @class */ (function (_super) {
    __extends(Pen, _super);
    function Pen(color, width) {
        var _this = _super.call(this, ToolType.Pen, color, width) || this;
        _this.value = [];
        return _this;
    }
    Pen.prototype.start = function (x, y) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        this.currPage.ctx.beginPath();
        this.currPage.ctx.moveTo(x, y);
        this.value.push({ x: x, y: y });
        this.started = true;
    };
    Pen.prototype.move = function (x, y) {
        if (this.started) {
            this.currPage.ctx.lineTo(x, y);
            this.currPage.ctx.stroke();
            this.value.push({ x: x, y: y });
        }
    };
    Pen.prototype.end = function () {
        this.currPage.ctx.closePath();
        this.addHistory(this.value);
        this.value = [];
        this.started = false;
    };
    Pen.prototype.redraw = function (value) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        for (var i = 0; i < value.length; i++) {
            var m = value[i];
            if (i === 0) {
                this.currPage.ctx.beginPath();
                this.currPage.ctx.moveTo(m.x, m.y);
            }
            else if (i > 0 && i < (value.length - 1)) {
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
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line(color, width) {
        var _this = _super.call(this, ToolType.Line, color, width) || this;
        _this.value = {
            start: null,
            end: null
        };
        return _this;
    }
    Line.prototype.init = function (currPage) {
        this.actualPage = currPage;
        var tempCanvas = document.createElement('canvas');
        tempCanvas.className = 'temp';
        $(this.actualPage.canvas).after(tempCanvas);
        tempCanvas.width = this.actualPage.canvas.width;
        tempCanvas.height = this.actualPage.canvas.height;
        this.tempPage = new Page(null, tempCanvas);
        _super.prototype.init.call(this, this.tempPage);
    };
    Line.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.actualPage = null;
        this.tempPage.canvas.remove();
        this.tempPage = null;
    };
    Line.prototype.start = function (x, y) {
        this.actualPage.ctx.strokeStyle = this.color;
        this.actualPage.ctx.lineWidth = this.width;
        this.tempPage.ctx.strokeStyle = this.color;
        this.tempPage.ctx.lineWidth = this.width;
        // we just set the start point
        this.value.start = { x: x, y: y };
        this.started = true;
    };
    Line.prototype.move = function (x, y) {
        if (this.started) {
            // wipe this tool's transparent canvas overlay
            this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);
            // start new line (at original start point) every time
            this.tempPage.ctx.beginPath();
            this.tempPage.ctx.moveTo(this.value.start.x, this.value.start.y);
            // line to their latest position
            this.tempPage.ctx.lineTo(x, y);
            this.tempPage.ctx.stroke();
            this.tempPage.ctx.closePath();
            // set new end path every move
            this.value.end = { x: x, y: y };
        }
    };
    Line.prototype.end = function () {
        // wipe this tool's transparent canvas overlay
        this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);
        // redraw to actual canvas and add to history
        this.redraw(this.value);
        this.addHistory(this.value, this.actualPage);
        this.value.start = null;
        this.value.end = null;
        this.started = false;
    };
    Line.prototype.redraw = function (value) {
        this.actualPage.ctx.beginPath();
        this.actualPage.ctx.moveTo(value.start.x, value.start.y);
        this.actualPage.ctx.lineTo(value.end.x, value.end.y);
        this.actualPage.ctx.stroke();
        this.actualPage.ctx.closePath();
    };
    return Line;
}(Tool));
var Box = /** @class */ (function (_super) {
    __extends(Box, _super);
    function Box(color, width) {
        var _this = _super.call(this, ToolType.Box, color, width) || this;
        _this.value = {
            start: null,
            end: null
        };
        return _this;
    }
    Box.prototype.init = function (currPage) {
        this.actualPage = currPage;
        var tempCanvas = document.createElement('canvas');
        tempCanvas.className = 'temp';
        $(this.actualPage.canvas).after(tempCanvas);
        tempCanvas.width = this.actualPage.canvas.width;
        tempCanvas.height = this.actualPage.canvas.height;
        this.tempPage = new Page(null, tempCanvas);
        _super.prototype.init.call(this, this.tempPage);
    };
    Box.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.actualPage = null;
        this.tempPage.canvas.remove();
        this.tempPage = null;
    };
    Box.prototype.start = function (x, y) {
        this.actualPage.ctx.strokeStyle = this.color;
        this.actualPage.ctx.lineWidth = this.width;
        this.tempPage.ctx.strokeStyle = this.color;
        this.tempPage.ctx.lineWidth = this.width;
        // we just set the start point
        this.value.start = { x: x, y: y };
        this.started = true;
    };
    Box.prototype.move = function (x, y) {
        if (this.started) {
            // wipe this tool's transparent canvas overlay
            this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);
            // draw box (four lines) every time
            this.tempPage.ctx.beginPath();
            this.tempPage.ctx.moveTo(this.value.start.x, this.value.start.y);
            this.tempPage.ctx.lineTo(this.value.start.x, y);
            this.tempPage.ctx.lineTo(x, y);
            this.tempPage.ctx.lineTo(x, this.value.start.y);
            this.tempPage.ctx.lineTo(this.value.start.x, this.value.start.y);
            this.tempPage.ctx.stroke();
            this.tempPage.ctx.closePath();
            // set new end path every move
            this.value.end = { x: x, y: y };
        }
    };
    Box.prototype.end = function () {
        // wipe this tool's transparent canvas overlay
        this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);
        // redraw to actual canvas and add to history
        this.redraw(this.value);
        this.addHistory(this.value, this.actualPage);
        this.value.start = null;
        this.value.end = null;
        this.started = false;
    };
    Box.prototype.redraw = function (value) {
        this.actualPage.ctx.beginPath();
        this.actualPage.ctx.moveTo(value.start.x, value.start.y);
        this.actualPage.ctx.lineTo(value.start.x, value.end.y);
        this.actualPage.ctx.lineTo(value.end.x, value.end.y);
        this.actualPage.ctx.lineTo(value.end.x, value.start.y);
        this.actualPage.ctx.lineTo(value.start.x, value.start.y);
        this.actualPage.ctx.stroke();
        this.actualPage.ctx.closePath();
    };
    return Box;
}(Tool));
var Textbox = /** @class */ (function (_super) {
    __extends(Textbox, _super);
    function Textbox(color, width) {
        var _this = _super.call(this, ToolType.Text, color, width) || this;
        _this.activated = false;
        return _this;
    }
    Textbox.prototype.init = function (currPage) {
        _super.prototype.init.call(this, currPage);
        this.currPage.ctx.fillStyle = this.color;
        this.currPage.ctx.font = this.width * 10 + "px Arial";
    };
    Textbox.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.activated) {
            this.write();
        }
        this.started = false;
        this.activated = false;
        if (this.hiddenText)
            this.hiddenText.remove();
    };
    Textbox.prototype.start = function (x, y) {
        if (this.activated) {
            this.write();
        }
        this.started = true;
        this.value = { x: x, y: y, text: '' };
    };
    Textbox.prototype.move = function (x, y) {
        if (this.started) {
            this.value = { x: x, y: y, text: '' };
        }
    };
    Textbox.prototype.end = function () {
        this.started = false;
        if (!this.activated) {
            // enable text input to canvas
            this.activated = true;
            this.hiddenText = $('<input type="text" class="temp">');
            $(this.currPage.canvas).after(this.hiddenText);
            this.hiddenText.css({
                'top': this.value.y - 15,
                'left': this.value.x,
                'color': this.color,
                'font-size': this.width * 10 + 'px',
                'height': this.width * 10 + 'px',
                'line-height': this.width * 10 + 'px'
            });
            var self = this;
            this.hiddenText.on('mousedown touchstart', function (e) {
                self.hiddenText.focus();
                return false;
            });
            this.hiddenText.on('input', function (e) {
                var strVal = self.hiddenText.val().toString();
                self.value.text = strVal;
                self.hiddenText.width(self.currPage.ctx.measureText(strVal).width);
            });
            this.hiddenText.focus();
        }
    };
    Textbox.prototype.write = function () {
        var strVal = this.hiddenText.val().toString(), yOffset = (this.width * 10 / 2) - 3;
        if (strVal.length > 0) {
            this.currPage.ctx.fillText(strVal, this.value.x, this.value.y + yOffset);
            this.addHistory(this.value);
        }
        this.activated = false;
        this.hiddenText.remove();
    };
    Textbox.prototype.redraw = function (value) {
        this.currPage.ctx.font = this.width * 10 + "px Arial";
        this.currPage.ctx.fillText(value.text, value.x, value.y);
    };
    return Textbox;
}(Tool));
var ToolType;
(function (ToolType) {
    ToolType[ToolType["Pen"] = 0] = "Pen";
    ToolType[ToolType["Line"] = 1] = "Line";
    ToolType[ToolType["Box"] = 2] = "Box";
    ToolType[ToolType["Text"] = 3] = "Text";
    ToolType[ToolType["Graph"] = 4] = "Graph";
})(ToolType || (ToolType = {}));
//# sourceMappingURL=tools.js.map