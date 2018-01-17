class Page {
    id: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    history: Action[];
    historyIndex: number;

    constructor(num: number, canvas: HTMLCanvasElement) {
        this.id = num;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.history = [];
        this.historyIndex = -1;
    }

    applyListeners(tool: Tool) {
        tool.currPage = this;

        this.canvas.addEventListener('mousedown', tool.mousedown, false);
        this.canvas.addEventListener('mousemove', tool.mousemove, false);
	    this.canvas.addEventListener('mouseup', tool.mouseup, false);
	    this.canvas.addEventListener('touchstart', tool.touchstart, false);
	    this.canvas.addEventListener('touchmove', tool.touchmove, false);
	    this.canvas.addEventListener('touchend', tool.touchend, false);
    }

    removeListeners(tool: Tool) {
        tool.currPage = null;

        this.canvas.removeEventListener('mousedown', tool.mousedown, false);
        this.canvas.removeEventListener('mousemove', tool.mousemove, false);
	    this.canvas.removeEventListener('mouseup', tool.mouseup, false);
	    this.canvas.removeEventListener('touchstart', tool.touchstart, false);
	    this.canvas.removeEventListener('touchmove', tool.touchmove, false);
	    this.canvas.removeEventListener('touchend', tool.touchend, false);
    }

    clear(bgColor: string) {
        this.ctx.fillStyle= bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    undo(bgColor: string) {
        this.clear(bgColor);

        if (this.historyIndex > -1) {
            this.historyIndex--;
            for (var i = 0; i < this.history.length; i++) {
                if (i <= this.historyIndex) {
                    Tool.redraw(this.history[i], this);
                } else break;
            }
        }
    }

    redo() {
        if (this.history[this.historyIndex + 1]) {
            this.historyIndex++;
            Tool.redraw(this.history[this.historyIndex], this);
        }
    }
}

interface Action {
    toolType: ToolType;
    color: string,
    width: number;
    value: any;
}