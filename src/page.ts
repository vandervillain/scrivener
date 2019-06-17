import { Tool, ToolType } from "./tools";

export class Page {
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

        this.canvas.addEventListener('mousedown', e => tool.mousedown(e), false);
        this.canvas.addEventListener('mousemove', e => tool.mousemove(e), false);
	    this.canvas.addEventListener('mouseup', e => tool.mouseup(e), false);
	    this.canvas.addEventListener('touchstart', e => tool.touchstart(e), false);
	    this.canvas.addEventListener('touchmove', e => tool.touchmove(e), false);
	    this.canvas.addEventListener('touchend', e => tool.touchend(e), false);
    }

    removeListeners(tool: Tool) {
        tool.currPage = null;

        this.canvas.removeEventListener('mousedown', e => tool.mousedown(e), false);
        this.canvas.removeEventListener('mousemove', e => tool.mousemove(e), false);
	    this.canvas.removeEventListener('mouseup', e => tool.mouseup(e), false);
	    this.canvas.removeEventListener('touchstart', e => tool.touchstart(e), false);
	    this.canvas.removeEventListener('touchmove', e => tool.touchmove(e), false);
	    this.canvas.removeEventListener('touchend', e => tool.touchend(e), false);
    }

    clear() {
        var currFillStyle = this.ctx.fillStyle;

        this.ctx.fillStyle = 'rgba(0,0,0,1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = currFillStyle;
    }

    undo() {
        this.clear();

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

export interface Action {
    toolType: ToolType;
    color: string,
    width: number;
    value: any;
}