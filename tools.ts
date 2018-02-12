class Tool {
    type: ToolType;
    color: string;
    width: number;
    started: boolean;
    // relation to current page
    currPage: Page;
    // saved value used for history and redrawing
    value: any;
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

    init(currPage: Page) {
        this.currPage = currPage;
        this.currPage.applyListeners(this);
    }

    destroy() {
        this.currPage.removeListeners(this);
        this.currPage = null;
    }

    start(x: number, y: number) {}

    move(x: number, y: number) {}

    end() {}

    addHistory(value: any, currPageOverride?: Page) {
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
    }

    redraw(value: any) {}

    static ToolInstance(type: ToolType, color: string, width: number) {
        var tool = null;
        switch(type) {
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
    }

    static redraw(action: Action, page: Page) {
        var tool: any = Tool.ToolInstance(action.toolType, action.color, action.width);
        tool.currPage = page;
        tool.actualPage = page;
        tool.redraw(JSON.parse(action.value));
    }
}

class Pen extends Tool {
    value: {x: number, y: number}[];

    constructor(color: string, width: number) { 
        super(ToolType.Pen, color, width); 
        this.value = [];
    }

    start(x: number, y: number) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;
        this.currPage.ctx.beginPath();
        this.currPage.ctx.moveTo(x, y);
        this.value.push({x: x, y: y});
        this.started = true;
    }

    move(x: number, y: number) {
        if (this.started) {
            this.currPage.ctx.lineTo(x, y);
            this.currPage.ctx.stroke();
            this.value.push({x: x, y: y});
        }
    }

    end() {
        this.currPage.ctx.closePath();
        this.addHistory(this.value);
        this.value = [];
        this.started = false;
    }

    redraw(value: {x: number, y: number}[]) {
        this.currPage.ctx.strokeStyle = this.color;
        this.currPage.ctx.lineWidth = this.width;

        for (var i = 0; i < value.length; i++) {
            let m = value[i];

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
    }
}

class Line extends Tool {
    actualPage: Page;
    tempPage: Page;
    value: {
        start: {x:number, y:number},
        end: {x:number, y:number} 
    };

    constructor(color: string, width: number) {
        super(ToolType.Line, color, width);

        this.value = {
            start: null,
            end: null
        };
    }

    init(currPage: Page) {
        this.actualPage = currPage;

        var tempCanvas = document.createElement('canvas');
        tempCanvas.className = 'temp';
        $(this.actualPage.canvas).after(tempCanvas);
        tempCanvas.width = this.actualPage.canvas.width;
        tempCanvas.height = this.actualPage.canvas.height;

        this.tempPage = new Page(null, tempCanvas);
        super.init(this.tempPage);
    }

    destroy() {
        super.destroy();

        this.actualPage = null;
        this.tempPage.canvas.remove();
        this.tempPage = null;
    }

    start(x: number, y: number) {
        this.actualPage.ctx.strokeStyle = this.color;
        this.actualPage.ctx.lineWidth = this.width;
        this.tempPage.ctx.strokeStyle = this.color;
        this.tempPage.ctx.lineWidth = this.width;
        
        // we just set the start point
        this.value.start = {x: x, y: y};
        this.started = true;
    }

    move(x: number, y: number) {
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
            this.value.end = {x: x, y: y};
        }
    }

    end() {
        // wipe this tool's transparent canvas overlay
        this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);

        // redraw to actual canvas and add to history
        this.redraw(this.value);
        this.addHistory(this.value, this.actualPage);

        this.value.start = null;
        this.value.end = null;
        this.started = false;
    }

    redraw(value: { start: {x:number, y:number}, end: {x:number, y:number} }) {
        this.actualPage.ctx.beginPath();
        this.actualPage.ctx.moveTo(value.start.x, value.start.y);
        this.actualPage.ctx.lineTo(value.end.x, value.end.y);
        this.actualPage.ctx.stroke();
        this.actualPage.ctx.closePath();
    }
}

class Box extends Tool {
    actualPage: Page;
    tempPage: Page;
    value: {
        start: {x:number, y:number},
        end: {x:number, y:number} 
    };

    constructor(color: string, width: number) {
        super(ToolType.Box, color, width);

        this.value = {
            start: null,
            end: null
        };
    }

    init(currPage: Page) {
        this.actualPage = currPage;

        var tempCanvas = document.createElement('canvas');
        tempCanvas.className = 'temp';
        $(this.actualPage.canvas).after(tempCanvas);
        tempCanvas.width = this.actualPage.canvas.width;
        tempCanvas.height = this.actualPage.canvas.height;

        this.tempPage = new Page(null, tempCanvas);
        super.init(this.tempPage);
    }

    destroy() {
        super.destroy();

        this.actualPage = null;
        this.tempPage.canvas.remove();
        this.tempPage = null;
    }

    start(x: number, y: number) {
        this.actualPage.ctx.strokeStyle = this.color;
        this.actualPage.ctx.lineWidth = this.width;
        this.tempPage.ctx.strokeStyle = this.color;
        this.tempPage.ctx.lineWidth = this.width;
        
        // we just set the start point
        this.value.start = {x: x, y: y};
        this.started = true;
    }

    move(x: number, y: number) {
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
            this.value.end = {x: x, y: y};
        }
    }

    end() {
        // wipe this tool's transparent canvas overlay
        this.tempPage.ctx.clearRect(0, 0, this.tempPage.canvas.width, this.tempPage.canvas.height);

        // redraw to actual canvas and add to history
        this.redraw(this.value);
        this.addHistory(this.value, this.actualPage);

        this.value.start = null;
        this.value.end = null;
        this.started = false;
    }

    redraw(value: { start: {x:number, y:number}, end: {x:number, y:number} }) {
        this.actualPage.ctx.beginPath();
        this.actualPage.ctx.moveTo(value.start.x, value.start.y);
        this.actualPage.ctx.lineTo(value.start.x, value.end.y);
        this.actualPage.ctx.lineTo(value.end.x, value.end.y);
        this.actualPage.ctx.lineTo(value.end.x, value.start.y);
        this.actualPage.ctx.lineTo(value.start.x, value.start.y);
        this.actualPage.ctx.stroke();
        this.actualPage.ctx.closePath();
    }
}

class Textbox extends Tool {
    value: {x: number, y: number, text: string};
    hiddenText: JQuery;
    activated: boolean;

    constructor(color: string, width: number) {
        super(ToolType.Text, color, width);
        this.activated = false;
    }

    init(currPage: Page) {
        super.init(currPage);
        this.currPage.ctx.fillStyle = this.color;
        this.currPage.ctx.font = this.width * 10 + "px Arial";
    }

    destroy() {
        super.destroy();

        if (this.activated) {
            this.write();
        }

        this.started = false;
        this.activated = false;
        if (this.hiddenText) this.hiddenText.remove();
    }

    start(x: number, y: number) {
        if (this.activated) {
            this.write();
        }

        this.started = true;
        this.value = {x: x, y: y, text: ''};
    }

    move(x: number, y: number) {
        if (this.started) {
            this.value = {x: x, y: y, text: ''};
        }
    }

    end() {
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
            this.hiddenText.on('mousedown touchstart', function(e) {
                self.hiddenText.focus();
                return false;
            });
            this.hiddenText.on('input', function(e) {
                var strVal = self.hiddenText.val().toString();
                self.value.text = strVal;
                self.hiddenText.width(self.currPage.ctx.measureText(strVal).width);
            });
            this.hiddenText.focus();
        }
    }

    write() {
        var strVal = this.hiddenText.val().toString(),
            yOffset = (this.width * 10 / 2) - 3;
            
        if (strVal.length > 0) {
            this.currPage.ctx.fillText(strVal, this.value.x, this.value.y + yOffset);
            this.addHistory(this.value);
        }

        this.activated = false;
        this.hiddenText.remove();
    }

    redraw(value: {x: number, y: number, text: string}) {
        var yOffset = (this.width * 10 / 2) - 3;
        this.currPage.ctx.font = this.width * 10 + "px Arial";
        this.currPage.ctx.fillText(value.text, value.x, value.y + yOffset);
    }
}

enum ToolType {
    Pen,
    Line,
    Box,
    Text,
    Graph
}