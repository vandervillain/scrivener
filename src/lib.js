"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var electron_1 = require("electron");
var tools_1 = require("./tools");
var page_1 = require("./page");
var Lib = (function () {
    function Lib() {
        var _this = this;
        this.el = {
            header: document.getElementById('header'),
            content: document.getElementById('content'),
            undo: document.getElementById('undo'),
            redo: document.getElementById('redo'),
            save: document.getElementById('save'),
            load: document.getElementById('load'),
            currPage: document.getElementById('curr-page'),
            clearPage: document.getElementById('clear-page'),
            prevPage: document.getElementById('prev-page'),
            nextPage: document.getElementById('next-page'),
            exit: document.getElementById('exit'),
            toolOptions: document.getElementById('tool-options'),
            currTool: document.getElementById('curr-tool'),
            pen: document.getElementById('pen'),
            line: document.getElementById('line'),
            box: document.getElementById('box'),
            text: document.getElementById('text'),
            graph: document.getElementById('graph'),
            colorToggle: document.getElementById('color-toggle'),
            colorInput: document.getElementById('color-input'),
            recentColors: document.getElementById('recent-colors')
        };
        var defaultColor = '#ffffff', defaultWidth = 3;
        this.config = {
            color: defaultColor,
            width: defaultWidth,
            bgColor: '#000000',
            recentColors: [defaultColor],
            page: 1,
            tool: new tools_1.Pen(defaultColor, defaultWidth)
        };
        document.getElementsByTagName('body')[0].style.backgroundColor = this.config.bgColor;
        this.pages = [];
        var page = this.newPage(1);
        this.config.tool.init(page);
        this.refit();
        window.addEventListener('resize', function () { return _this.refit(); }, false);
        this.initColorSelect();
        this.initToolSelect();
        this.el.undo.addEventListener('click', function () { return _this.getCurrPage().undo(); });
        this.el.redo.addEventListener('click', function () { return _this.getCurrPage().redo(); });
        this.el.save.addEventListener('click', function () { return _this.save(); });
        this.el.load.addEventListener('click', function () { return _this.load(); });
        this.el.clearPage.addEventListener('click', function () { return _this.clear(); });
        this.el.prevPage.addEventListener('click', function (e) {
            var el = e.currentTarget;
            if (el.classList.contains('disabled'))
                return false;
            _this.goToPage(_this.config.page - 1);
        });
        this.el.nextPage.addEventListener('click', function (e) {
            var el = e.currentTarget;
            if (el.classList.contains('disabled'))
                return false;
            _this.goToPage(_this.config.page + 1);
        });
        this.el.exit.addEventListener('click', function () { return electron_1.remote.getCurrentWindow().close(); });
        this.el.content.addEventListener('click', function () { return _this.closeMenu(); });
    }
    Lib.prototype.closeMenu = function () {
        _.forEach(document.getElementsByClassName('open'), function (el) { return el.classList.remove('open'); });
    };
    Lib.prototype.rgb2hex = function (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    };
    Lib.prototype.initColorSelect = function () {
        var _this = this;
        this.el.colorToggle.style.color = this.config.color;
        this.el.currTool.style.color = this.config.color;
        this.el.colorInput.value = this.config.color;
        this.el.colorToggle.addEventListener('click', function () { return _this.el.colorInput.click(); });
        this.el.colorInput.addEventListener('change', function (e) {
            _this.setColor(_this.el.colorInput.value.toString());
            _.forEach(document.getElementsByClassName('open'), function (el) { return el.classList.remove('open'); });
        });
    };
    Lib.prototype.setColor = function (color) {
        this.config.color = color;
        this.config.tool.color = this.config.color;
        this.el.colorToggle.style.color = this.config.color;
        this.el.currTool.style.color = this.config.color;
        if (this.config.recentColors.indexOf(this.config.color) !== -1) {
            this.config.recentColors.splice(this.config.recentColors.indexOf(this.config.color), 1);
        }
        this.config.recentColors.push(this.config.color);
        if (this.config.recentColors.length > 5)
            this.config.recentColors.shift();
        this.renderRecentColors();
    };
    Lib.prototype.renderRecentColors = function () {
        var _this = this;
        _.forEach(this.el.recentColors.childNodes, function (c) { return _this.el.recentColors.removeChild(c); });
        var reversed = this.config.recentColors.slice(0).reverse();
        for (var c in reversed) {
            if (c != '0') {
                var span = document.createElement('span');
                span.classList.add('glyphicons');
                span.classList.add('glyphicons-stop');
                span.style.color = reversed[c];
                this.el.recentColors.appendChild(span);
            }
        }
        _.forEach(this.el.recentColors.childNodes, function (node) {
            node.addEventListener('click', function (e) {
                var el = e.currentTarget;
                var color = _this.rgb2hex(el.style.color);
                _this.setColor(color);
                _this.closeMenu();
            });
        });
    };
    Lib.prototype.initToolSelect = function () {
        var _this = this;
        this.el.currTool.addEventListener('click', function (e) { return _this.el.toolOptions.classList.contains('open') ?
            _this.el.toolOptions.classList.remove('open') : _this.el.toolOptions.classList.add('open'); });
        this.el.pen.addEventListener('click', function (e) { return _this.toolChange(tools_1.ToolType.Pen, e.currentTarget); });
        this.el.line.addEventListener('click', function (e) { return _this.toolChange(tools_1.ToolType.Line, e.currentTarget); });
        this.el.box.addEventListener('click', function (e) { return _this.toolChange(tools_1.ToolType.Box, e.currentTarget); });
        this.el.text.addEventListener('click', function (e) { return _this.toolChange(tools_1.ToolType.Text, e.currentTarget); });
        this.el.graph.addEventListener('click', function (e) { return _this.toolChange(tools_1.ToolType.Graph, e.currentTarget); });
    };
    Lib.prototype.toolChange = function (type, target) {
        var el = target;
        _.forEach(document.getElementsByClassName('temp'), function (el) { return el.remove(); });
        this.el.currTool.className = el.className;
        this.el.currTool.classList.add('label');
        this.closeMenu();
        this.config.tool.destroy();
        var tool = tools_1.Tool.ToolInstance(type, this.config.color, this.config.width);
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
        this.el.content.style.height = window.innerHeight - this.el.header.offsetHeight + "px";
        var newCanvas = document.createElement('canvas');
        newCanvas.dataset['page'] = pageNum.toString();
        this.el.content.append(newCanvas);
        newCanvas.height = this.el.content.offsetHeight;
        newCanvas.width = this.el.content.offsetWidth;
        newCanvas.style.height = this.el.content.offsetHeight + 'px';
        newCanvas.style.width = this.el.content.offsetWidth + 'px';
        var page = new page_1.Page(pageNum, newCanvas);
        this.pages.push(page);
        return page;
    };
    Lib.prototype.goToPage = function (pageNum) {
        var oldPage = this.getCurrPage();
        this.config.tool.destroy();
        oldPage.canvas.style.display = 'hidden';
        var existingPage = this.getPage(pageNum);
        if (existingPage) {
            existingPage.canvas.style.direction = 'block';
            this.config.tool.init(existingPage);
        }
        else {
            var newPage = this.newPage(pageNum);
            this.config.tool.init(newPage);
        }
        this.config.page = pageNum;
        this.el.currPage.innerHTML = this.config.page.toString();
        if (this.config.page <= 1)
            this.el.prevPage.classList.add('disabled');
        else
            this.el.prevPage.classList.remove('disabled');
    };
    Lib.prototype.save = function () {
    };
    Lib.prototype.load = function () {
    };
    Lib.prototype.refit = function () {
        var canvas = this.getCurrPage().canvas;
        this.el.content.style.height = window.innerHeight - this.el.header.offsetHeight + "px";
        canvas.height = this.el.content.offsetHeight;
        canvas.width = this.el.content.offsetWidth;
        canvas.style.height = this.el.content.offsetHeight + 'px';
        canvas.style.width = this.el.content.offsetWidth + 'px';
    };
    Lib.prototype.clear = function () {
        this.getCurrPage().clear();
    };
    return Lib;
}());
exports.Lib = Lib;
//# sourceMappingURL=lib.js.map