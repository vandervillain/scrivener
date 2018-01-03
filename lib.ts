import * as $ from "jquery";
import { remote } from 'electron';
import { defaultCipherList, WSAENOTCONN } from "constants";

export class Lib {
    header: JQuery;
    content: JQuery;
    config: AppConfig;
    history: Action[];

    constructor() {
        var self = this;
        this.header = $('#header');
        this.content = $('#content');

        this.config = {
            bgColor: '#000000',
            recentColors: [],
            page: 0
        };
        this.history = [];

        self.refit();
        window.addEventListener('resize', self.refit.bind(self), false);

        self.initColor();
        self.initTool();
        
        self.header.find('.clear-page').on('click', e => {
            self.clear();
        });

        self.header.find('.prev-page').on('click', function(e) {
            if ($(this).hasClass('disabled')) return false;
            self.goToPage(self.config.page - 1);
        });

        self.header.find('.next-page').on('click', function(e) {
            if ($(this).hasClass('disabled')) return false;
            self.goToPage(self.config.page + 1);
        });

        self.header.find('.exit-app').on('click', e => {
            remote.getCurrentWindow().close();
        });

        self.content.on('click', e => {
            self.header.find('.open').removeClass('open');
        });
    }

    rgb2hex(rgb: any) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x: any) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }

    initColor() {
        var self = this,
            defaultColor = '#ffffff',
            toolToggle = $('.tool-selector > span.glyphicons'),
            colorToggle = $('.tool-options .color-selector span.glyphicons'),
            colorSelector = $('.tool-options .color-selector input[type="color"]');

        self.config.color = defaultColor;
        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);
        colorSelector.val(defaultColor);

        colorToggle.on('click', function(e) {
            colorSelector.click();
        });

        colorSelector.on('change', function(e) {
            self.setColor($(this).val().toString());
            self.header.find('.open').removeClass('open');
        });
    }

    setColor(color: string) {
        var self = this,
            toolToggle = $('.tool-selector > span.glyphicons'),
            colorToggle = $('.tool-options .color-selector > span.glyphicons');

        self.config.color = color;
        self.config.tool.color = self.config.color;
        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);

        if (self.config.recentColors.indexOf(self.config.color) !== -1) {
            self.config.recentColors.splice(self.config.recentColors.indexOf(self.config.color), 1);
        }

        self.config.recentColors.push(self.config.color);
        if (self.config.recentColors.length > 5) self.config.recentColors.shift();

        self.renderRecentColors();
    }

    renderRecentColors() {
        var self = this,
            div = $('.tool-options .color-selector .recent-colors');

        div.empty();

        var reversed = self.config.recentColors.slice(0).reverse();
        for (var c in reversed) {
            var span = $('<span class="glyphicons glyphicons-stop">');

            span.css('color', reversed[c]);
            div.append(span);
        }

        div.find('span').on('click', function(e) {
            var color = self.rgb2hex($(this).css('color'));
            self.setColor(color);
            self.header.find('.open').removeClass('open');
        });
    }

    initTool() {
        var self = this;
        var pen = new Pen(self.config.color, 3);
        pen.init();
        self.config.tool = pen;

        var defaultColor = '#ffffff',
            toolToggle = $('.tool-selector > span.glyphicons'),
            toolOptions = $('.tool-selector .tool-options');
        
        toolToggle.on('click', e => {
            toolOptions.toggleClass('open');
        });
    }

    goToPage(pageNum: number) {
        var self = this;

        var currCanvas = $('canvas:visible');
        var existingCanvas = $('canvas[data-page="' + pageNum + '"]');

        if (existingCanvas.length > 0) {
            // init existing canvas
            currCanvas.hide();
            existingCanvas.show();
            self.config.tool.init();
        }
        else {
            // create new canvas
            var newCanvas = $('<canvas data-page="' + pageNum + '">');

            // init new canvas
            currCanvas.hide();
            self.content.append(newCanvas);
            self.config.tool.init();

            var canvas = <HTMLCanvasElement>$('canvas:visible')[0];
            canvas.height = this.content.height();
            canvas.width = this.content.width();
        }

        self.config.page = pageNum;
        self.header.find('.curr-page').text(self.config.page + 1);
        if (self.config.page == 0) self.header.find('.prev-page').addClass('disabled');
        else self.header.find('.prev-page').removeClass('disabled');
    }

    refit() {
        var canvas = <HTMLCanvasElement>$('canvas:visible')[0];
        this.content.height(window.innerHeight - this.header.height());
        
        canvas.height = this.content.height();
        canvas.width = this.content.width();
    }

    clear() {
        this.refit();

        var canvas = <HTMLCanvasElement>$('canvas:visible')[0],
            ctx = canvas.getContext('2d');

        ctx.fillStyle= this.config.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

interface AppConfig {
    tool?: Tool;
    bgColor?: string;
    color?: string;
    recentColors: string[];
    page?: number;
}

interface Action {
}

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