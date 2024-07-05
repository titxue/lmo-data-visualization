import {useDebounce, useObserver} from "./utils.js";
import {ITemplateConfig, TConfigTextType, TOtherConfig, TThemeConfig} from "./@types/template.js";

export interface ILMOTemplateImplementsMethods {
    readonly otherConfigChange: (config: TOtherConfig) => void;
    readonly themeColorChange: (config: TThemeConfig) => void;
    readonly render: () => void | Promise<void>;
}

export interface ILMOTemplate extends ILMOTemplateImplementsMethods {
    readonly conf: ITemplateConfig;
    readonly isSynthesisMode: boolean;
    readonly tryRender: () => void;
}

export default abstract class LmoTemplate implements ILMOTemplate {
    public conf: ITemplateConfig;
    public readonly isSynthesisMode: boolean;

    protected constructor(conf: ITemplateConfig) {
        this.conf = conf;
        this.isSynthesisMode = location.href.includes('__type=h');
        this.initDrag();
        this.initViewStyle();
        this.sendMessage('TEMPLATE_FULL_CONFIG', conf);
        this.initText();
        this.initBackground();
        this.fetchData();

        if (!this.isSynthesisMode) {
            addEventListener('message', (e: MessageEvent): void => this.onMessage(e));
            document.addEventListener('contextmenu', (e: MouseEvent): void => e.preventDefault());
        }
    }

    public abstract otherConfigChange(config: TOtherConfig): void;

    public abstract themeColorChange(config: TThemeConfig): void;

    public abstract render(): void | Promise<void>;

    public tryRender(): void {
        (async (): Promise<void> => {
            try {
                this.sendMessage('TEMPLATE_RENDER', 'RENDER');
                await this.render();
            } catch (e) {
                if (!this.isSynthesisMode)
                    throw e;
            }
        })();
        this.render();
    }

    private sendMessage(type: string, message: any): void {
        if (this.isSynthesisMode) return;

        parent.postMessage({
            type, message
        }, location.origin);
    }

    private fetchData(): void {
        fetch('data.json')
            .then((res: Response) => res.json())
            .then(json => {
                this.sendMessage('TEMPLATE_DATA', json);
                this.conf.data = json;
                this.tryRender();
            });
    }

    private initText(data?: TConfigTextType): void {
        const _this: LmoTemplate = this;

        if (!data)
            Object.values(this.conf.config.text).forEach((text: TConfigTextType) => this.initText(text));
        if (typeof data?.key === 'string' && data.key !== '')
            this.conf.config.text[data.key] = data;

        const elements = {
            'main-title': {
                value: this.conf.config.text.mainTitle, style: this.conf.config.text.mainTitle
            },
            'sub-title': {
                value: this.conf.config.text.subTitle, style: this.conf.config.text.subTitle
            },
            'from-source': {
                value: this.conf.config.text.fromSource, style: this.conf.config.text.fromSource
            }
        };

        Object.entries(elements).forEach(([id, {value, style}]): void => {
            const element: HTMLElement | null = document.getElementById(id);

            if (!element) return;
            const textValue: HTMLElement | null = element.querySelector('.text-value');

            if (!textValue) return;

            setValueStyle(textValue, value);
            setStyle(element, style);

            function setValueStyle(el: HTMLElement, config: TConfigTextType): void {
                el.innerHTML = config.value;
                el.style.color = config.color;
                el.style.fontSize = config.fontSize + 'px';
            }

            function setStyle(el: HTMLElement, config: TConfigTextType): void {
                el.style.top = config.y + 'px';
                el.style.textAlign = config.align;
                el.style.left = config.x + 'px';
                el.style.width = config.width + 'px';
                el.style.height = config.height + 'px';
                el.style.display = config.display ? 'block' : 'none';
                if (!_this.isSynthesisMode)
                    el.setAttribute('contenteditable', 'true');
                else {
                    try {
                        document.querySelectorAll('.text-value').forEach((i: Element): void => i.removeAttribute('contenteditable'));
                    } catch (e) {
                        throw e;
                    }
                }
            }
        });
    }

    private sendTemplateSelectTextConfig(el: HTMLElement): void {
        const style: CSSStyleDeclaration = getComputedStyle(el);
        const y: string = style.top;
        const x: string = style.left;
        const w: string = style.width;
        const h: string = style.height;
        const key: string = el.getAttribute('data-name') ?? '';
        const subTextValueEl: Element = el.querySelector('.text-value') as Element;
        const conf = {
            width: parseInt(w.substring(0, w.length - 2)),
            height: parseInt(h.substring(0, h.length - 2)),
            x: parseInt(x.substring(0, x.length - 2)),
            y: parseInt(y.substring(0, y.length - 2)),
            value: ''
        };

        if (key === '' && subTextValueEl) return;

        conf.value = subTextValueEl.innerHTML;

        this.conf.config.text[key] = {
            ...this.conf.config.text[key],
            ...conf,
            key: key
        };

        this.sendMessage('TEMPLATE_SELECT_TEXT_ELEMENT', {
            ...this.conf.config.text[key]
        });
    }

    private onMessage(e: MessageEvent): void {
        if (e.origin !== origin) return;
        const {data} = e;

        if (!('message' in data) || !('type' in data)) return;

        const {type, message} = data;

        switch (type) {
            case 'SET_TEXT_CONFIG':
                this.initText(message);
                break;
            case 'SET_DURATION':
                this.conf.config.video.duration = message.duration;
                this.tryRender();
                break;
            case 'SET_DATA':
                this.conf.data = message;
                this.tryRender();
                break;
            case 'SET_BACKGROUND_IMAGE':
                this.conf.config.background = message;
                this.initBackground();
                break;
            case 'SET_OTHER_CONFIG':
                this.conf.otherConfig.values = {
                    ...this.conf.otherConfig.values, ...message
                }
                this.otherConfigChange(this.conf.otherConfig as TOtherConfig);
                break;
            case 'SET_THEME_COLOR':
                this.conf.config.theme = {
                    ...this.conf.config.theme,
                    ...message
                };
                this.themeColorChange(message as TThemeConfig);
                break;
            case 'RENDER':
                this.tryRender();
                break;
            case 'GET_TEMPLATE_DATA':
                this.sendMessage('GET_TEMPLATE_DATA', this.conf.data);
                break;
            case 'GET_CONFIG':
                this.sendMessage('GET_CONFIG', this.conf);
                break;
            case 'VIDEO_CONFIG_CHANGE':
                this.conf.config.video = {
                    ...this.conf.config.video,
                    ...message
                };
                const appEl: HTMLElement | null = document.getElementById('app');

                if (appEl) {
                    appEl.style.width = `${document.body.offsetWidth}px`;
                    appEl.style.height = `calc(${document.body.offsetHeight}px - 120px)`;
                    appEl.style.userSelect = 'none';
                    appEl.style.marginTop = '120px';
                }
                this.initViewStyle();
                break;
            default:
                break;
        }
    }

    private initDrag(): void {
        if (this.isSynthesisMode) return;

        function getElementById(id: string): HTMLElement {
            return document.getElementById(id) as HTMLElement;
        }

        getElementById('main-title').setAttribute('data-name', 'mainTitle');
        getElementById('sub-title').setAttribute('data-name', 'subTitle');
        getElementById('from-source').setAttribute('data-name', 'fromSource');

        const elements: string[] = ['main-title', 'sub-title', 'from-source'];
        const classListObServerConfig = {attributes: true, attributeFilter: ['class']};
        const initInteract = (element: HTMLElement): void => {
            initSquare(element);

            const __this = this;

            const moveDebounce = useDebounce(function (x: number, y: number, el: HTMLElement): void {
                const elData: string = el.getAttribute('data-name') as string;

                __this.conf.config.text[elData].x = x;
                __this.conf.config.text[elData].y = y;

                __this.sendTemplateSelectTextConfig(el);
            }, 100);

            let x: number = 0, y: number = 0, angle: number = 0, scale: number = 1;

            const {interact}: any = window;

            interact(element)
                .draggable({
                    inertia: false, modifiers: [interact.modifiers.restrictRect({
                        restriction: 'parent', endOnly: true
                    })], onstart: function (event: MouseEvent): void {
                        x = event.clientX;
                        y = event.clientY;
                    }, onmove: function (event: MouseEvent): void {
                        const dx: number = event.clientX - x;
                        const dy: number = event.clientY - y;
                        const newX: number = parseInt(element.style.left) + dx;
                        const newY: number = parseInt(element.style.top) + dy;

                        element.style.left = newX + 'px';
                        element.style.top = newY + 'px';
                        x = event.clientX;
                        y = event.clientY;
                        moveDebounce(newY, newX, element);
                    }
                })
                .resizable({
                    edges: {left: true, right: true, bottom: true, top: true},

                    listeners: {
                        move(event: any): void {
                            const target = event.target;
                            let x = (parseFloat(target.getAttribute('data-x')) || 0);
                            let y = (parseFloat(target.getAttribute('data-y')) || 0);

                            target.style.width = event.rect.width + 'px'
                            target.style.height = event.rect.height + 'px'
                            x += event.deltaRect.left
                            y += event.deltaRect.top

                            target.style.transform = 'translate(' + x + 'px,' + y + 'px)'
                            target.setAttribute('data-x', x)
                            target.setAttribute('data-y', y)
                        }
                    }, modifiers: [interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }), interact.modifiers.restrictSize({
                        min: {width: 10, height: 10}
                    })],

                    inertia: true
                })
        }
        const initEvent = (element: HTMLElement): void => {
            let isInputChinese: boolean = false;

            const handleEvent = (e: MouseEvent | Event | any): void => {

                const inputHandleEvent = (): void => {
                    if (e.type === 'click' && e.target)
                        this.sendTemplateSelectTextConfig(e.target.classList.contains('text-value') ? e.target.parentElement : e.target);
                }

                if (e.type === 'compositionstart') {
                    isInputChinese = true;
                    return;
                }
                if (e.type === 'input') {
                    if (!isInputChinese) return inputHandleEvent();
                }
                if (e.type === 'compositionend') {
                    isInputChinese = false;
                    return inputHandleEvent();
                }

                elements.forEach((i: string): void => {
                    const targetId = e.target.classList.contains('text-value') ? e.target.parentElement.id : e.target.id;
                    const _: HTMLElement = document.getElementById(i) as HTMLElement;

                    if (i !== targetId && _.classList.length > 0) {
                        _.classList.remove('active');
                        _.classList.remove('square-container');
                    }
                });
                if (e.type === 'click') {
                    e.stopPropagation();
                    inputHandleEvent();
                }
                element.classList.add('square-container');
                element.classList.add('active');
            };

            element.addEventListener('mousedown', handleEvent);
            element.addEventListener('click', handleEvent);
            element.addEventListener('input', handleEvent);
            element.addEventListener('compositionend', handleEvent);
            element.addEventListener('compositionstart', handleEvent);
            initGlobalEvent();
        };

        elements.map((i: string): void => {
            const el: HTMLElement = document.getElementById(i) as HTMLElement;

            initInteract(el);
            initEvent(el);
            useObserver((e: any): void => {
                if (e[0].target.classList.length === 0) this.sendMessage('TEMPLATE_SELECT_TEXT_CLOSE', {});
            }).observe(el, classListObServerConfig);
        });

        function initSquare(element: HTMLElement): void {
            function createSquare(className: string): HTMLDivElement {
                const square: HTMLDivElement = document.createElement('div');

                square.classList.add('square');
                square.classList.add(className);
                return square;
            }

            const squareTL: HTMLDivElement = createSquare('top-left');
            const squareTR: HTMLDivElement = createSquare('top-right');
            const squareBL: HTMLDivElement = createSquare('bottom-left');
            const squareBR: HTMLDivElement = createSquare('bottom-right');

            element.append(squareTL, squareTR, squareBL, squareBR);

            initSquareEvent();
            element.append(squareBR);
            initSquareEvent();
        }

        function initSquareEvent(): void {
            // 给所有square 阻止冒泡
            document.querySelectorAll('.square').forEach((i: Element): void => {
                i.addEventListener('click', (e: Event): void => {
                    e.stopPropagation();
                });
            });
        }

        function initGlobalEvent(): void {
            document.addEventListener('click', (e: MouseEvent): void => {
                elements.forEach((i: string): void => {
                    // @ts-ignore
                    const idName = e.target.parentElement.id;

                    if (i !== idName && elements.includes(idName) || idName === '') {
                        const classList: DOMTokenList = getElementById(i).classList;

                        if (classList.length !== 0) {
                            getElementById(i).classList.remove('active');
                            getElementById(i).classList.remove('square-container');
                        }
                    }
                });
            })
        }
    }

    private initBackground(): void {
        const {
            type,
            color,
            image,
            arrangement
        } = this.conf.config.background;
        const templateEl: HTMLElement | null = document.getElementById('template');

        if (!templateEl) return;

        if (type === '')
            templateEl.style.background = '#fff';
        if (type === 'color' || type === 'theme')
            templateEl.style.background = color === '' ? '#fff' : color;

        if (type === 'image') {
            if (image.includes('data:image') && image.includes('base64'))
                templateEl.style.backgroundImage = "url(" + image + ")";
            else
                templateEl.style.backgroundImage = "url(" + "/api/" + image + ")";

            templateEl.style.backgroundRepeat = 'no-repeat';

            if (arrangement === 'cover')
                templateEl.style.backgroundSize = 'cover';

            if (arrangement === 'left')
                templateEl.style.backgroundPositionX = 'left';

            if (arrangement === 'right')
                templateEl.style.backgroundPositionX = 'right';
        }
    }

    private initViewStyle(): void {
        const body: HTMLElement = document.body;
        const {clarity} = this.conf.config.video;
        let width: string;
        let height: string;

        switch (clarity) {
            case '1080P':
                width = '1920px';
                height = '1080px';
                break;
            case '2K':
                width = '2560px';
                height = '1440px';
                break;
            case '4K':
                width = '4096px';
                height = '2160px';
                break;
            default:
                width = '1920px';
                height = '1080px';
        }

        body.style.width = width;
        body.style.height = height;
    }
}