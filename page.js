var Page = /** @class */ (function () {
    function Page(num, canvas) {
        this.id = num;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
        this.historyIndex = -1;
    }
    Page.prototype.applyListeners = function (tool) {
        tool.currPage = this;
        this.canvas.addEventListener('mousedown', tool.mousedown, false);
        this.canvas.addEventListener('mousemove', tool.mousemove, false);
        this.canvas.addEventListener('mouseup', tool.mouseup, false);
        this.canvas.addEventListener('touchstart', tool.touchstart, false);
        this.canvas.addEventListener('touchmove', tool.touchmove, false);
        this.canvas.addEventListener('touchend', tool.touchend, false);
    };
    Page.prototype.removeListeners = function (tool) {
        tool.currPage = null;
        this.canvas.removeEventListener('mousedown', tool.mousedown, false);
        this.canvas.removeEventListener('mousemove', tool.mousemove, false);
        this.canvas.removeEventListener('mouseup', tool.mouseup, false);
        this.canvas.removeEventListener('touchstart', tool.touchstart, false);
        this.canvas.removeEventListener('touchmove', tool.touchmove, false);
        this.canvas.removeEventListener('touchend', tool.touchend, false);
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
                    Tool.redraw(this.history[i], this);
                }
                else
                    break;
            }
        }
    };
    Page.prototype.redo = function () {
        if (this.history[this.historyIndex + 1]) {
            this.historyIndex++;
            Tool.redraw(this.history[this.historyIndex], this);
        }
    };
    return Page;
}());
//# sourceMappingURL=page.js.map