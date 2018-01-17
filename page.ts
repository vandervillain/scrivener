class Page {
    id: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    history: Action[];

    constructor(num: number, canvas: HTMLCanvasElement) {
        this.id = num;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
    }

    applyListeners(tool: Tool) {
        var self = this;

        tool.currCanvas = this.canvas;
        tool.currCtx = this.ctx;

        this.canvas.addEventListener('mousedown', tool.mousedown, false);
        this.canvas.addEventListener('mousemove', tool.mousemove, false);
	    this.canvas.addEventListener('mouseup', tool.mouseup, false);
	    this.canvas.addEventListener('touchstart', tool.touchstart, false);
	    this.canvas.addEventListener('touchmove', tool.touchmove, false);
	    this.canvas.addEventListener('touchend', tool.touchend, false);
    }

    removeListeners(tool: Tool) {
        tool.currCanvas = null;
        tool.currCtx = null;

        this.canvas.removeEventListener('mousedown', tool.mousedown, false);
        this.canvas.removeEventListener('mousemove', tool.mousemove, false);
	    this.canvas.removeEventListener('mouseup', tool.mouseup, false);
	    this.canvas.removeEventListener('touchstart', tool.touchstart, false);
	    this.canvas.removeEventListener('touchmove', tool.touchmove, false);
	    this.canvas.removeEventListener('touchend', tool.touchend, false);
    }
}

interface Action {

}