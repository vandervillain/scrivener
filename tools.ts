class Tool {
    type: ToolType;
    color: string;
    width: number;
    started: boolean;

    constructor(type: ToolType, color: string, width: number) {
        this.type = type;
        this.color = color;
        this.width = width;
        this.started = false;
    }

    init() {
        var self = this,
            canvas = <HTMLCanvasElement>$('canvas:visible')[0],
            ctx = canvas.getContext('2d');
        
        canvas.addEventListener('mousedown', function(e) {
            var x = e.pageX - canvas.offsetLeft, y = e.pageY - canvas.offsetTop;
            self.start(ctx, x, y);
        }, false);

        canvas.addEventListener('mousemove', function(e) {
            var x = e.pageX - canvas.offsetLeft, y = e.pageY - canvas.offsetTop;
            self.move(ctx, x, y);
        }, false);
    
	    canvas.addEventListener('mouseup', function(e) {
            self.end(ctx);
        }, false);

        // Touch Events
	    canvas.addEventListener('touchstart', function(e) {
            var x = e.touches[0].pageX - canvas.offsetLeft, y = e.touches[0].pageY - canvas.offsetTop;
            self.start(ctx, x, y);
        }, false);

	    canvas.addEventListener('touchmove', function(e) {
            var x = e.touches[0].pageX - canvas.offsetLeft, y = e.touches[0].pageY - canvas.offsetTop;
            self.move(ctx, x, y);
        }, false);
    
	    canvas.addEventListener('touchend', function(e) {
            self.end(ctx);
        }, false);
    }

    start(ctx: CanvasRenderingContext2D, x: number, y: number) {}

    move(ctx: CanvasRenderingContext2D, x: number, y: number) {}

    end(ctx: CanvasRenderingContext2D) {}
}

class Pen extends Tool {
    constructor(color: string, width: number) { super(ToolType.Pen, color, width); }

    start(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(x, y);

        this.started = true;
    }

    move(ctx: CanvasRenderingContext2D, x: number, y: number) {
        if (this.started) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    end(ctx: CanvasRenderingContext2D) {
        ctx.closePath();
        this.started = false;
    }
}

enum ToolType {
    Pen,
    Line,
    Rect,
    Grid
}