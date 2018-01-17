class Tool {
    type: ToolType;
    color: string;
    width: number;
    started: boolean;
    // relation to current page
    currPage: Page;
    // events
    mousedown: EventListener;
    mousemove: EventListener;
    mouseup: EventListener;
    touchstart: EventListener;
    touchmove: EventListener;
    touchend: EventListener;

    constructor(type: ToolType, color: string, width: number) {
        var self = this;
        this.type = type;
        this.color = color;
        this.width = width;
        this.started = false;

        this.mousedown = function(e: MouseEvent) {
            var x = e.pageX - self.currPage.canvas.offsetLeft, y = e.pageY - self.currPage.canvas.offsetTop;
            self.start.call(self, x, y);
        };

        this.mousemove = function(e: MouseEvent) {
            var x = e.pageX - self.currPage.canvas.offsetLeft, y = e.pageY - self.currPage.canvas.offsetTop;
            self.move.call(self, x, y);
        };
    
	    this.mouseup = function(e: MouseEvent) {
            self.end.call(self);
        };

	    this.touchstart = function(e: TouchEvent) {
            var x = e.touches[0].pageX - self.currPage.canvas.offsetLeft, y = e.touches[0].pageY - self.currPage.canvas.offsetTop;
            self.start.call(self, x, y);
        };

	    this.touchmove = function(e: TouchEvent) {
            var x = e.touches[0].pageX - self.currPage.canvas.offsetLeft, y = e.touches[0].pageY - self.currPage.canvas.offsetTop;
            self.move.call(self, x, y);
        };
    
	    this.touchend = function(e: TouchEvent) {
            self.end.call(self);
        };
    }

    start(x: number, y: number) {}

    move(x: number, y: number) {}

    end() {}

    addHistory(value: any) {
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
    }

    redraw(value: any) {}

    static redraw(action: Action, page: Page) {
        switch (action.toolType) {
            case ToolType.Pen:
                let tool = new Pen(action.color, action.width);
                tool.currPage = page;
                tool.redraw(action.value);
                break;
        }
    }
}

class Pen extends Tool {
    moveTo: {x: number, y: number}[];

    constructor(color: string, width: number) { 
        super(ToolType.Pen, color, width); 
        this.moveTo = [];
    }

    start(x: number, y: number) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        this.currPage.ctx.beginPath();
        this.currPage.ctx.moveTo(x, y);
        this.moveTo.push({x: x, y: y});
        this.started = true;
    }

    move(x: number, y: number) {
        if (this.started) {
            this.currPage.ctx.lineTo(x, y);
            this.currPage.ctx.stroke();
            this.moveTo.push({x: x, y: y});
        }
    }

    end() {
        this.currPage.ctx.closePath();
        this.addHistory(this.moveTo);
        this.moveTo = [];
        this.started = false;
    }

    redraw(value: any) {
        var moveTo = <{x: number, y: number}[]>value;

        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;

        for (var i = 0; i < moveTo.length; i++) {
            let m = moveTo[i];

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
    }
}

enum ToolType {
    Pen,
    Line,
    Rect,
    Grid
}