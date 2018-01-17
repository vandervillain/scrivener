var Page = /** @class */ (function () {
    function Page(num, canvas) {
        this.id = num;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
    }
    Page.prototype.applyListeners = function (tool) {
        var self = this;
        tool.currCanvas = this.canvas;
        tool.currCtx = this.ctx;
        this.canvas.addEventListener('mousedown', tool.mousedown, false);
        this.canvas.addEventListener('mousemove', tool.mousemove, false);
        this.canvas.addEventListener('mouseup', tool.mouseup, false);
        this.canvas.addEventListener('touchstart', tool.touchstart, false);
        this.canvas.addEventListener('touchmove', tool.touchmove, false);
        this.canvas.addEventListener('touchend', tool.touchend, false);
    };
    Page.prototype.removeListeners = function (tool) {
        tool.currCanvas = null;
        tool.currCtx = null;
        this.canvas.removeEventListener('mousedown', tool.mousedown, false);
        this.canvas.removeEventListener('mousemove', tool.mousemove, false);
        this.canvas.removeEventListener('mouseup', tool.mouseup, false);
        this.canvas.removeEventListener('touchstart', tool.touchstart, false);
        this.canvas.removeEventListener('touchmove', tool.touchmove, false);
        this.canvas.removeEventListener('touchend', tool.touchend, false);
    };
    return Page;
}());
//# sourceMappingURL=page.js.map