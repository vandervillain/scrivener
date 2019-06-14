import * as $ from "jquery";
import * as _ from 'underscore';
import { remote } from 'electron';
import { defaultCipherList, WSAENOTCONN, ECHILD } from "constants";

export class Lib {
    header: JQuery;
    content: JQuery;
    config: AppConfig;
    pages: Page[];

    constructor() {
        var self = this;
        this.header = $('#header');
        this.content = $('#content');

        var defaultColor = '#ffffff',
            defaultWidth = 3;

        this.config = {
            color: defaultColor,
            width: defaultWidth,
            bgColor: '#000000',
            recentColors: [defaultColor],
            page: 1,
            tool: new Pen(defaultColor, defaultWidth)
        };

        $('body').css('background-color', this.config.bgColor);

        // init page and tool
        this.pages = [];
        var page = self.newPage(1);
        self.config.tool.init(page);

        self.refit();
        window.addEventListener('resize', self.refit.bind(self), false);

        // init UI events
        self.initColorSelect();
        self.initToolSelect();
        
        self.header.find('.undo').on('click', function(e) {
            self.getCurrPage().undo();
        })

        self.header.find('.redo').on('click', function(e) {
            self.getCurrPage().redo();
        })

        self.header.find('.save').on('click', e => self.save);

        self.header.find('.load').on('click', e => self.load);

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

    initColorSelect() {
        var self = this,
            toolToggle = $('.tool-selector > span.glyphicons'),
            colorToggle = $('.tool-options .color-selector span.glyphicons'),
            colorSelector = $('.tool-options .color-selector input[type="color"]');

        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);
        colorSelector.val(self.config.color);

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
            if (c != '0') {
                var span = $('<span class="glyphicons glyphicons-stop">');

                span.css('color', reversed[c]);
                div.append(span);
            }
        }

        div.find('span').on('click', function(e) {
            var color = self.rgb2hex($(this).css('color'));
            self.setColor(color);
            self.header.find('.open').removeClass('open');
        });
    }

    initToolSelect() {
        var self = this,
            defaultColor = '#ffffff',
            toolToggle = $('.tool-selector > span.glyphicons'),
            toolOptions = $('.tool-selector .tool-options');
        
        toolToggle.on('click', e => {
            toolOptions.toggleClass('open');
        });

        toolOptions.find('.pen').on('click', function(e) { return self.toolChange(ToolType.Pen, this); });
        toolOptions.find('.line').on('click', function(e) { return self.toolChange(ToolType.Line, this); });
        toolOptions.find('.box').on('click', function(e) { return self.toolChange(ToolType.Box, this); });
        toolOptions.find('.text').on('click', function(e) { return self.toolChange(ToolType.Text, this); });
        toolOptions.find('.graph').on('click',  function(e) { return self.toolChange(ToolType.Graph, this); });
    }

    toolChange(type: ToolType, el: HTMLElement) {
        // remove any temp tool canvases
        $('canvas.temp').remove();

        // set tool label
        var label = $('.tool-selector .label:first');
        label[0].className = el.className;
        label.addClass('label');
        this.header.find('.open').removeClass('open');

        // init new tool
        this.config.tool.destroy();
        var tool = Tool.ToolInstance(type, this.config.color, this.config.width);
        this.config.tool = tool;
        this.config.tool.init(this.getCurrPage());
    }

    getPage(pageNum: number) {
        return _.find(this.pages, function (p: Page) { return p.id == pageNum; });
    }

    getCurrPage() {
        var self = this;
        return _.find(this.pages, function (p: Page) { return p.id == self.config.page; });
    }

    newPage(pageNum: number) {
        var self = this;

        this.content.height(window.innerHeight - this.header.height());
        
        // create new canvas
        var newCanvas = $('<canvas data-page="' + pageNum + '">');
        self.content.append(newCanvas);
        
        var canvas = <HTMLCanvasElement>newCanvas[0];
        canvas.height = this.content.height();
        canvas.width = this.content.width();
        canvas.style.height = this.content.height() + 'px';
        canvas.style.width = this.content.width() + 'px';
        var page = new Page(pageNum, canvas);
        self.pages.push(page);

        return page;
    } 

    goToPage(pageNum: number) {
        var self = this;

        // un-init old
        let oldPage = self.getCurrPage();
        self.config.tool.destroy();
        $(oldPage.canvas).hide();

        var existingPage = self.getPage(pageNum);
        if (existingPage) {
            // init existing page
            $(existingPage.canvas).show();
            self.config.tool.init(existingPage);
        }
        else {
            // create new page
            var newPage = self.newPage(pageNum);
            self.config.tool.init(newPage);
        }

        self.config.page = pageNum;
        self.header.find('.curr-page').text(self.config.page);
        if (self.config.page <= 1) self.header.find('.prev-page').addClass('disabled');
        else self.header.find('.prev-page').removeClass('disabled');
    }

    save() {

    }

    load() {
        
    }

    refit() {
        var canvas = <HTMLCanvasElement>$('canvas:visible')[0];
        this.content.height(window.innerHeight - this.header.height());
        
        canvas.height = this.content.height();
        canvas.width = this.content.width();

        canvas.style.height = this.content.height() + 'px';
        canvas.style.width = this.content.width() + 'px';
    }

    clear() {
        this.getCurrPage().clear();
    }
}

interface AppConfig {
    tool: Tool;
    bgColor: string;
    color: string;
    width: number;
    recentColors: string[];
    page: number;
}