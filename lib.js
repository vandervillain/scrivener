"use strict";
exports.__esModule = true;
var $ = require("jquery");
var electron_1 = require("electron");
var Lib = /** @class */ (function () {
    function Lib() {
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
    Lib.prototype.initColor = function () {
        var self = this, defaultColor = '#ffffff', toolToggle = $('.tool-selector > span.glyphicons'), colorToggle = $('.tool-options .color-selector span.glyphicons'), colorSelector = $('.tool-options .color-selector input[type="color"]');
        self.config.color = defaultColor;
        colorToggle.css('color', self.config.color);
        toolToggle.css('color', self.config.color);
        colorSelector.val(defaultColor);
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
            var span = $('<span class="glyphicons glyphicons-stop">');
            span.css('color', reversed[c]);
            div.append(span);
        }
        div.find('span').on('click', function (e) {
            var color = self.rgb2hex($(this).css('color'));
            self.setColor(color);
            self.header.find('.open').removeClass('open');
        });
    };
    Lib.prototype.initTool = function () {
        var self = this;
        var pen = new Pen(self.config.color, 3);
        pen.init();
        self.config.tool = pen;
        var defaultColor = '#ffffff', toolToggle = $('.tool-selector > span.glyphicons'), toolOptions = $('.tool-selector .tool-options');
        toolToggle.on('click', function (e) {
            toolOptions.toggleClass('open');
        });
    };
    Lib.prototype.goToPage = function (pageNum) {
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
            var canvas = $('canvas:visible')[0];
            canvas.height = this.content.height();
            canvas.width = this.content.width();
        }
        self.config.page = pageNum;
        self.header.find('.curr-page').text(self.config.page + 1);
        if (self.config.page == 0)
            self.header.find('.prev-page').addClass('disabled');
        else
            self.header.find('.prev-page').removeClass('disabled');
    };
    Lib.prototype.refit = function () {
        var canvas = $('canvas:visible')[0];
        this.content.height(window.innerHeight - this.header.height());
        canvas.height = this.content.height();
        canvas.width = this.content.width();
    };
    Lib.prototype.clear = function () {
        this.refit();
        var canvas = $('canvas:visible')[0], ctx = canvas.getContext('2d');
        ctx.fillStyle = this.config.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    return Lib;
}());
exports.Lib = Lib;
//# sourceMappingURL=lib.js.map