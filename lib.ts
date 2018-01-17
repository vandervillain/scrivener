import * as $ from "jquery";
import * as _ from 'underscore';
import { remote } from 'electron';
import { defaultCipherList, WSAENOTCONN } from "constants";

export class Lib {
    header: JQuery;
    content: JQuery;
    config: AppConfig;
    pages: Page[];

    constructor() {
        var self = this;
        this.header = $('#header');
        this.content = $('#content');

        var defaultColor = '#ffffff';
        this.config = {
            color: defaultColor,
            bgColor: '#000000',
            recentColors: [defaultColor],
            page: 1,
            tool: new Pen(defaultColor, 3)
        };

        // init page
        this.pages = [];
        var page = self.newPage(1);
        page.applyListeners(self.config.tool);

        self.refit();
        window.addEventListener('resize', self.refit.bind(self), false);

        // init UI events
        self.initColorSelect();
        self.initToolSelect();
        
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
        var defaultColor = '#ffffff',
            toolToggle = $('.tool-selector > span.glyphicons'),
            toolOptions = $('.tool-selector .tool-options');
        
        toolToggle.on('click', e => {
            toolOptions.toggleClass('open');
        });
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

        // create new canvas
        var newCanvas = $('<canvas data-page="' + pageNum + '">');
        self.content.append(newCanvas);
        
        var canvas = <HTMLCanvasElement>newCanvas[0];
        canvas.height = this.content.height();
        canvas.width = this.content.width();

        var page = new Page(pageNum, canvas);
        self.pages.push(page);

        return page;
    } 

    goToPage(pageNum: number) {
        var self = this;

        // un-init old
        let oldPage = self.getCurrPage();
        oldPage.removeListeners(self.config.tool);
        $(oldPage.canvas).hide();

        var existingPage = self.getPage(pageNum);
        if (existingPage) {
            // init existing page
            $(existingPage.canvas).show();
            self.getCurrPage().applyListeners(self.config.tool);
        }
        else {
            // create new page
            self.newPage(pageNum).applyListeners(self.config.tool);
        }

        self.config.page = pageNum;
        self.header.find('.curr-page').text(self.config.page);
        if (self.config.page <= 1) self.header.find('.prev-page').addClass('disabled');
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
    tool: Tool;
    bgColor: string;
    color: string;
    recentColors: string[];
    page: number;
}