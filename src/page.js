"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tools_1 = require("./tools");
var Page = (function () {
    function Page(num, canvas) {
        this.id = num;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
        this.historyIndex = -1;
    }
    Page.prototype.applyListeners = function (tool) {
        tool.currPage = this;
        this.canvas.addEventListener('mousedown', function (e) { return tool.mousedown(e); }, false);
        this.canvas.addEventListener('mousemove', function (e) { return tool.mousemove(e); }, false);
        this.canvas.addEventListener('mouseup', function (e) { return tool.mouseup(e); }, false);
        this.canvas.addEventListener('touchstart', function (e) { return tool.touchstart(e); }, false);
        this.canvas.addEventListener('touchmove', function (e) { return tool.touchmove(e); }, false);
        this.canvas.addEventListener('touchend', function (e) { return tool.touchend(e); }, false);
    };
    Page.prototype.removeListeners = function (tool) {
        tool.currPage = null;
        this.canvas.removeEventListener('mousedown', function (e) { return tool.mousedown(e); }, false);
        this.canvas.removeEventListener('mousemove', function (e) { return tool.mousemove(e); }, false);
        this.canvas.removeEventListener('mouseup', function (e) { return tool.mouseup(e); }, false);
        this.canvas.removeEventListener('touchstart', function (e) { return tool.touchstart(e); }, false);
        this.canvas.removeEventListener('touchmove', function (e) { return tool.touchmove(e); }, false);
        this.canvas.removeEventListener('touchend', function (e) { return tool.touchend(e); }, false);
    };
    Page.prototype.clear = function () {
        var currFillStyle = this.ctx.fillStyle;
        this.ctx.fillStyle = 'rgba(0,0,0,1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = currFillStyle;
    };
    Page.prototype.undo = function () {
        this.clear();
        if (this.historyIndex > -1) {
            this.historyIndex--;
            for (var i = 0; i < this.history.length; i++) {
                if (i <= this.historyIndex) {
                    tools_1.Tool.redraw(this.history[i], this);
                }
                else
                    break;
            }
        }
    };
    Page.prototype.redo = function () {
        if (this.history[this.historyIndex + 1]) {
            this.historyIndex++;
            tools_1.Tool.redraw(this.history[this.historyIndex], this);
        }
    };
    return Page;
}());
exports.Page = Page;
//# sourceMappingURL=page.js.map