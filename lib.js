"use strict";
exports.__esModule = true;
var $ = require("jquery");
var _ = require("underscore");
var electron_1 = require("electron");
var Lib = /** @class */ (function () {
    function Lib() {
        var self = this;
        this.header = $('#header');
        this.content = $('#content');
        var defaultColor = '#ffffff', defaultWidth = 3;
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
        self.header.find('.undo').on('click', function (e) {
            self.getCurrPage().undo();
        });
        self.header.find('.redo').on('click', function (e) {
            self.getCurrPage().redo();
        });
        self.header.find('.clear-page').on('click', function (e) {
            self.clear();
        });
        self.header.find('.prev-page').on('click', function (e) {
            if ($(this).hasClass('disabled'))
                return false;
            self.goToPage(self.config.page - 1);
        });
        self.header.find('.next-page').on('click', function (e) {
            if ($(this).hasClass('disabled'))
                return false;
            self.goToPage(self.config.page + 1);
        });
        self.header.find('.exit-app').on('click', function (e) {
            electron_1.remote.getCurrentWindow().close();
        });
        self.content.on('click', function (e) {
            self.header.find('.open').removeClass('open');
        });
    }
    Lib.prototype.rgb2hex = function (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    };
    Lib.prototype.initColorSelect = function () {
        var self = this, toolToggle = $('.tool-selector > span.glyphicons'), colorToggle = $('.tool-options .color-selector span.glyphicons'), colorSelector = $('.tool-options .color-selector input[type="color"]');
        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);
        colorSelector.val(self.config.color);
        colorToggle.on('click', function (e) {
            colorSelector.click();
        });
        colorSelector.on('change', function (e) {
            self.setColor($(this).val().toString());
            self.header.find('.open').removeClass('open');
        });
    };
    Lib.prototype.setColor = function (color) {
        var self = this, toolToggle = $('.tool-selector > span.glyphicons'), colorToggle = $('.tool-options .color-selector > span.glyphicons');
        self.config.color = color;
        self.config.tool.color = self.config.color;
        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);
        if (self.config.recentColors.indexOf(self.config.color) !== -1) {
            self.config.recentColors.splice(self.config.recentColors.indexOf(self.config.color), 1);
        }
        self.config.recentColors.push(self.config.color);
        if (self.config.recentColors.length > 5)
            self.config.recentColors.shift();
        self.renderRecentColors();
    };
    Lib.prototype.renderRecentColors = function () {
        var self = this, div = $('.tool-options .color-selector .recent-colors');
        div.empty();
        var reversed = self.config.recentColors.slice(0).reverse();
        for (var c in reversed) {
            if (c != '0') {
                var span = $('<span class="glyphicons glyphicons-stop">');
                span.css('color', reversed[c]);
                div.append(span);
            }
        }
        div.find('span').on('click', function (e) {
            var color = self.rgb2hex($(this).css('color'));
            self.setColor(color);
            self.header.find('.open').removeClass('open');
        });
    };
    Lib.prototype.initToolSelect = function () {
        var self = this, defaultColor = '#ffffff', toolToggle = $('.tool-selector > span.glyphicons'), toolOptions = $('.tool-selector .tool-options');
        toolToggle.on('click', function (e) {
            toolOptions.toggleClass('open');
        });
        toolOptions.find('.pen').on('click', function (e) { return self.toolChange(ToolType.Pen, this); });
        toolOptions.find('.line').on('click', function (e) { return self.toolChange(ToolType.Line, this); });
        toolOptions.find('.box').on('click', function (e) { return self.toolChange(ToolType.Box, this); });
        toolOptions.find('.text').on('click', function (e) { return self.toolChange(ToolType.Text, this); });
        toolOptions.find('.graph').on('click', function (e) { return self.toolChange(ToolType.Graph, this); });
    };
    Lib.prototype.toolChange = function (type, el) {
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
    };
    Lib.prototype.getPage = function (pageNum) {
        return _.find(this.pages, function (p) { return p.id == pageNum; });
    };
    Lib.prototype.getCurrPage = function () {
        var self = this;
        return _.find(this.pages, function (p) { return p.id == self.config.page; });
    };
    Lib.prototype.newPage = function (pageNum) {
        var self = this;
        this.content.height(window.innerHeight - this.header.height());
        // create new canvas
        var newCanvas = $('<canvas data-page="' + pageNum + '">');
        self.content.append(newCanvas);
        var canvas = newCanvas[0];
        canvas.height = this.content.height();
        canvas.width = this.content.width();
        canvas.style.height = this.content.height() + 'px';
        canvas.style.width = this.content.width() + 'px';
        var page = new Page(pageNum, canvas);
        self.pages.push(page);
        return page;
    };
    Lib.prototype.goToPage = function (pageNum) {
        var self = this;
        // un-init old
        var oldPage = self.getCurrPage();
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
        if (self.config.page <= 1)
            self.header.find('.prev-page').addClass('disabled');
        else
            self.header.find('.prev-page').removeClass('disabled');
    };
    Lib.prototype.refit = function () {
        var canvas = $('canvas:visible')[0];
        this.content.height(window.innerHeight - this.header.height());
        canvas.height = this.content.height();
        canvas.width = this.content.width();
        canvas.style.height = this.content.height() + 'px';
        canvas.style.width = this.content.width() + 'px';
    };
    Lib.prototype.clear = function () {
        this.getCurrPage().clear();
    };
    return Lib;
}());
exports.Lib = Lib;
//# sourceMappingURL=lib.js.map