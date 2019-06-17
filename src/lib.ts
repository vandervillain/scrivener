import * as _ from 'lodash';
import { remote } from 'electron';
import { Pen, ToolType, Tool } from './tools';
import { Page } from './page';

export class Lib {
    config: AppConfig;
    pages: Page[];
    el: PageElements;

    constructor() {
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
            colorInput: document.getElementById('color-input') as HTMLInputElement,
            recentColors: document.getElementById('recent-colors')
        }

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

        document.getElementsByTagName('body')[0].style.backgroundColor = this.config.bgColor;

        // init page and tool
        this.pages = [];
        var page = this.newPage(1);
        this.config.tool.init(page);

        this.refit();
        window.addEventListener('resize', () => this.refit(), false);

        // init UI events
        this.initColorSelect();
        this.initToolSelect();
        
        this.el.undo.addEventListener('click', () => this.getCurrPage().undo());
        this.el.redo.addEventListener('click', () => this.getCurrPage().redo());
        this.el.save.addEventListener('click', () => this.save());
        this.el.load.addEventListener('click', () => this.load());
        this.el.clearPage.addEventListener('click', () => this.clear());

        this.el.prevPage.addEventListener('click', (e) => {
            var el = e.currentTarget as HTMLElement;
            if (el.classList.contains('disabled')) return false;
            this.goToPage(this.config.page - 1);
        });

        this.el.nextPage.addEventListener('click', (e) => {
            var el = e.currentTarget as HTMLElement;
            if (el.classList.contains('disabled')) return false;
            this.goToPage(this.config.page + 1);
        });

        this.el.exit.addEventListener('click', () => remote.getCurrentWindow().close());
        this.el.content.addEventListener('click', () => this.closeMenu());
    }

    closeMenu() {
        _.forEach(document.getElementsByClassName('open'), (el) => el.classList.remove('open'))
    }

    rgb2hex(rgb: any) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x: any) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }

    initColorSelect() {  
        this.el.colorToggle.style.color = this.config.color;
        this.el.currTool.style.color = this.config.color;
        this.el.colorInput.value = this.config.color;
        this.el.colorToggle.addEventListener('click', () => this.el.colorInput.click());
        this.el.colorInput.addEventListener('change', (e) => {
            this.setColor(this.el.colorInput.value.toString());
            _.forEach(document.getElementsByClassName('open'), (el) => el.classList.remove('open'));
        });
    }

    setColor(color: string) {
        this.config.color = color;
        this.config.tool.color = this.config.color;
        this.el.colorToggle.style.color = this.config.color;
        this.el.currTool.style.color = this.config.color;

        if (this.config.recentColors.indexOf(this.config.color) !== -1) {
            this.config.recentColors.splice(this.config.recentColors.indexOf(this.config.color), 1);
        }

        this.config.recentColors.push(this.config.color);
        if (this.config.recentColors.length > 5) this.config.recentColors.shift();

        this.renderRecentColors();
    }

    renderRecentColors() {
        _.forEach(this.el.recentColors.childNodes, (c) => this.el.recentColors.removeChild(c));

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

        _.forEach(this.el.recentColors.childNodes, (node) => {
            node.addEventListener('click', (e) => {
                var el = e.currentTarget as HTMLElement;
                var color = this.rgb2hex(el.style.color);
                this.setColor(color);
                this.closeMenu();
            });
        })
    }

    initToolSelect() {       
        this.el.currTool.addEventListener('click', e => this.el.toolOptions.classList.contains('open') ? 
            this.el.toolOptions.classList.remove('open') : this.el.toolOptions.classList.add('open'));

        this.el.pen.addEventListener('click', (e) => { return this.toolChange(ToolType.Pen, e.currentTarget); });
        this.el.line.addEventListener('click', (e) => { return this.toolChange(ToolType.Line, e.currentTarget); });
        this.el.box.addEventListener('click', (e) => { return this.toolChange(ToolType.Box, e.currentTarget); });
        this.el.text.addEventListener('click', (e) => { return this.toolChange(ToolType.Text, e.currentTarget); });
        this.el.graph.addEventListener('click',  (e) => { return this.toolChange(ToolType.Graph, e.currentTarget); });
    }

    toolChange(type: ToolType, target: EventTarget) {
        var el = target as HTMLElement;
        // remove any temp tool canvases
        _.forEach(document.getElementsByClassName('temp'), el => el.remove());

        // set tool label
        this.el.currTool.className = el.className;
        this.el.currTool.classList.add('label');
        this.closeMenu();

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
        this.el.content.style.height = `${window.innerHeight - this.el.header.offsetHeight}px`;
        
        // create new canvas
        var newCanvas = document.createElement('canvas') as HTMLCanvasElement;
        newCanvas.dataset['page'] = pageNum.toString();
        this.el.content.append(newCanvas);
    
        newCanvas.height = this.el.content.offsetHeight;
        newCanvas.width = this.el.content.offsetWidth;
        newCanvas.style.height = this.el.content.offsetHeight + 'px';
        newCanvas.style.width =  this.el.content.offsetWidth + 'px';
        var page = new Page(pageNum, newCanvas);
        this.pages.push(page);

        return page;
    } 

    goToPage(pageNum: number) {
        // un-init old
        let oldPage = this.getCurrPage();
        this.config.tool.destroy();
        oldPage.canvas.style.display = 'hidden';

        var existingPage = this.getPage(pageNum);
        if (existingPage) {
            // init existing page
            existingPage.canvas.style.direction = 'block';
            this.config.tool.init(existingPage);
        }
        else {
            // create new page
            var newPage = this.newPage(pageNum);
            this.config.tool.init(newPage);
        }

        this.config.page = pageNum;
        this.el.currPage.innerHTML = this.config.page.toString();
        if (this.config.page <= 1) this.el.prevPage.classList.add('disabled');
        else this.el.prevPage.classList.remove('disabled');
    }

    save() {

    }

    load() {
        
    }

    refit() {
        var canvas = this.getCurrPage().canvas;
        this.el.content.style.height = `${window.innerHeight - this.el.header.offsetHeight}px`;
        
        canvas.height = this.el.content.offsetHeight;
        canvas.width = this.el.content.offsetWidth;

        canvas.style.height = this.el.content.offsetHeight + 'px';
        canvas.style.width = this.el.content.offsetWidth + 'px';
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

interface PageElements {
    header: HTMLElement;
    content: HTMLElement;
    undo: HTMLElement;
    redo: HTMLElement;
    save: HTMLElement;
    load: HTMLElement;
    currPage: HTMLElement;
    clearPage: HTMLElement;
    prevPage: HTMLElement;
    nextPage: HTMLElement;
    exit: HTMLElement;
    currTool: HTMLElement;
    toolOptions: HTMLElement;
    pen: HTMLElement;
    line: HTMLElement;
    box: HTMLElement;
    text: HTMLElement;
    graph: HTMLElement;
    colorToggle: HTMLElement;
    colorInput: HTMLInputElement;
    recentColors: HTMLElement;
}