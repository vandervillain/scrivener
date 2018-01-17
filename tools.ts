class Tool {
    type: ToolType;
    color: string;
    width: number;
    started: boolean;
    // relation to current page
    currCanvas: HTMLCanvasElement;
    currCtx: CanvasRenderingContext2D;
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
            var x = e.pageX - self.currCanvas.offsetLeft, y = e.pageY - self.currCanvas.offsetTop;
            self.start.call(self, x, y);
        };

        this.mousemove = function(e: MouseEvent) {
            var x = e.pageX - self.currCanvas.offsetLeft, y = e.pageY - self.currCanvas.offsetTop;
            self.move.call(self, x, y);
        };
    
	    this.mouseup = function(e: MouseEvent) {
            self.end.call(self);
        };

	    this.touchstart = function(e: TouchEvent) {
            var x = e.touches[0].pageX - self.currCanvas.offsetLeft, y = e.touches[0].pageY - self.currCanvas.offsetTop;
            self.start.call(self, x, y);
        };

	    this.touchmove = function(e: TouchEvent) {
            var x = e.touches[0].pageX - self.currCanvas.offsetLeft, y = e.touches[0].pageY - self.currCanvas.offsetTop;
            self.move.call(self, x, y);
        };
    
	    this.touchend = function(e: TouchEvent) {
            self.end.call(self);
        };
    }

    start(x: number, y: number) {}

    move(x: number, y: number) {}

    end() {}
}

class Pen extends Tool {
    
    constructor(color: string, width: number) { super(ToolType.Pen, color, width); }

    start(x: number, y: number) {
        this.currCtx.strokeStyle = this.color;
        this.currCtx.lineWidth = this.width;
        this.currCtx.beginPath();
        this.currCtx.moveTo(x, y);

        this.started = true;
    }

    move(x: number, y: number) {
        if (this.started) {
            this.currCtx.lineTo(x, y);
            this.currCtx.stroke();
        }
    }

    end() {
        this.currCtx.closePath();
        this.started = false;
    }
}

enum ToolType {
    Pen,
    Line,
    Rect,
    Grid
}