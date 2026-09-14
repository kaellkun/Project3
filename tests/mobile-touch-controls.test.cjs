const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function bounded(source, start, end) {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from + start.length);
    assert.ok(from >= 0 && to > from, `Missing source boundaries: ${start}`);
    return source.slice(from, to);
}
// Read the installed engine; never embed or evaluate unrelated engine sections.
const inputSource = bounded(read('js/rmmz_core.js'), 'function Input()', 'function JsonEx()');
const mapSource = bounded(read('js/rmmz_scenes.js'),
    'Scene_Map.prototype.processMapTouch =', 'Scene_Map.prototype.isSceneChangeOk =');
const config = vm.createContext({});
vm.runInContext(read('js/plugins.js'), config);
const plugins = config.$plugins.filter(p => p.status &&
    ['MobileTouchControls', 'DisableMouseMapClickMove'].includes(p.name));
assert.equal(plugins.length, 2, 'Both regression targets must be enabled');

function dom() {
    const captures = new Map();
    class Element {
        constructor(tagName) {
            Object.assign(this, { tagName, parentNode: null, children: [], style: {},
                className: '', listeners: new Map(), attributes: {} });
            this.classList = { toggle: (name, force) => {
                const names = new Set(this.className.split(/\s+/).filter(Boolean));
                const add = force === undefined ? !names.has(name) : force;
                if (add) names.add(name); else names.delete(name);
                this.className = [...names].join(' ');
                return add;
            } };
        }
        appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
        setAttribute(name, value) { this.attributes[name] = value; }
        querySelector(selector) {
            for (const child of this.children) {
                if (selector[0] === '#' ? child.id === selector.slice(1) :
                    selector[0] === '.' ? child.className.split(/\s+/).includes(selector.slice(1)) :
                        child.tagName === selector) return child;
                const found = child.querySelector(selector);
                if (found) return found;
            }
            return null;
        }
        getBoundingClientRect() { return { left: 100, top: 100, width: 100, height: 100 }; }
        addEventListener(type, fn, options = {}) {
            if (typeof options === 'boolean') options = { capture: options };
            const list = this.listeners.get(type) || [];
            list.push({ fn, ...options });
            this.listeners.set(type, list);
        }
        removeEventListener(type, fn, options = {}) {
            const capture = typeof options === 'boolean' ? options : !!options.capture;
            this.listeners.set(type, (this.listeners.get(type) || []).filter(l =>
                l.fn !== fn || !!l.capture !== capture));
        }
        setPointerCapture(id) { captures.set(id, this); }
        hasPointerCapture(id) { return captures.get(id) === this; }
        releasePointerCapture(id) {
            if (!this.hasPointerCapture(id)) return;
            captures.delete(id);
            dispatch(this, 'lostpointercapture', { pointerId: id });
        }
    }
    function dispatch(target, type, data = {}) {
        if (/^pointer(move|up|cancel)$/.test(type)) target = captures.get(data.pointerId) || target;
        const event = { type, target, bubbles: true, cancelable: true, defaultPrevented: false,
            stopped: false, ...data,
            preventDefault() { if (this.cancelable && !this.passive) this.defaultPrevented = true; },
            stopPropagation() { this.stopped = true; } };
        const ancestors = [];
        for (let node = target.parentNode; node; node = node.parentNode) ancestors.push(node);
        const invoke = (node, capture, phase) => {
            event.currentTarget = node;
            event.eventPhase = phase;
            for (const listener of [...(node.listeners.get(type) || [])]) {
                if (!!listener.capture !== capture) continue;
                event.passive = !!listener.passive;
                if (listener.once) node.removeEventListener(type, listener.fn, listener);
                listener.fn.call(node, event);
            }
        };
        for (const node of [...ancestors].reverse()) {
            invoke(node, true, 1);
            if (event.stopped) break;
        }
        if (!event.stopped) { invoke(target, true, 2); invoke(target, false, 2); }
        if (event.bubbles && !event.stopped) {
            for (const node of ancestors) { invoke(node, false, 3); if (event.stopped) break; }
        }
        if (/^pointer(up|cancel)$/.test(type)) captures.get(data.pointerId)?.releasePointerCapture(data.pointerId);
        return event;
    }
    const window = new Element('window');
    const document = window.appendChild(new Element('document'));
    document.head = document.appendChild(new Element('head'));
    document.body = document.appendChild(new Element('body'));
    document.createElement = tag => new Element(tag);
    Object.assign(document, { readyState: 'complete', hidden: false });
    Object.assign(window, { innerWidth: 390, innerHeight: 844,
        visualViewport: { width: 390, height: 844 }, matchMedia: () => ({ matches: false }) });
    return { window, document, dispatch };
}

function setup() {
    const { window, document, dispatch } = dom();
    const gamepads = [];
    const destinations = [];
    const navigator = { getGamepads: () => gamepads };
    window.navigator = navigator;
    const context = vm.createContext({ window, document, navigator, console,
        Graphics: { pageToCanvasX: x => x, pageToCanvasY: y => y, isInsideCanvas: () => true },
        $gameMap: { canvasToMapX: x => Math.floor(x / 48), canvasToMapY: y => Math.floor(y / 48) },
        $gameTemp: { destination: null,
            setDestination(x, y) { this.destination = [x, y]; destinations.push([x, y]); },
            clearDestination() { this.destination = null; } } });
    vm.runInContext('function Scene_Base() {}\nScene_Base.prototype.update = function() {};\n' +
        'function Scene_Map() { this._touchCount = 0; }\n' +
        'const SceneManager = { _scene: { needsPageButtons: () => true } };', context);
    vm.runInContext(inputSource, context, { filename: 'rmmz_core.input-sections.js' });
    vm.runInContext(mapSource, context, { filename: 'rmmz_scenes.map-touch-section.js' });
    for (const plugin of plugins) {
        const file = `js/plugins/${plugin.name}.js`;
        vm.runInContext(read(file), context, { filename: file });
    }
    const { Input, TouchInput } = context;
    Input.initialize();
    TouchInput.initialize();
    vm.runInContext('new Scene_Base().update()', context);
    const scene = new context.Scene_Map();
    const canvas = document.body.appendChild(document.createElement('canvas'));
    const stick = document.querySelector('.mtc-stick');
    const knob = document.querySelector('.mtc-stick-knob');
    assert.ok(stick && knob && document.querySelector('.is-visible'));
    const frame = () => { Input.update(); TouchInput.update(); scene.processMapTouch(); };
    const pointer = (type, target = knob, id = 1, x = 150, y = 150) => dispatch(target, type,
        { pointerId: id, pointerType: 'touch', button: 0, clientX: x, clientY: y, pageX: x, pageY: y });
    const touch = (type, target = knob, x = 150, y = 150) => {
        const point = { identifier: 1, target, pageX: x, pageY: y, clientX: x, clientY: y };
        return dispatch(target, type, { changedTouches: [point],
            touches: /end|cancel/.test(type) ? [] : [point] });
    };
    const isolated = () => {
        for (const method of ['isPressed', 'isTriggered', 'isReleased', 'isCancelled', 'isMoved', 'isHovered', 'isClicked']) {
            assert.equal(TouchInput[method](), false, method);
        }
        assert.equal(destinations.length, 0);
        assert.equal(context.$gameTemp.destination, null);
    };
    return { ...context, window, document, dispatch, gamepads, destinations, canvas, stick, knob,
        scene, frame, pointer, touch, isolated };
}

for (const selector of ['.mtc-stick-knob', '.mtc-touch-blocker', '.mtc-cancel', '.mtc-pageup', '.mtc-pagedown']) {
    for (const stream of ['pointer', 'touch', 'mouse']) {
        test(`${selector}: independent ${stream} stream is isolated`, () => {
            const h = setup();
            const target = h.document.querySelector(selector);
            const types = stream === 'pointer' ? ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] :
                stream === 'touch' ? ['touchstart', 'touchmove', 'touchend', 'touchcancel'] :
                    ['mousedown', 'mousemove', 'mouseup', 'click', 'contextmenu'];
            let captured = 0, bubbled = 0;
            for (const type of types) {
                h.document.addEventListener(type, () => captured++, true);
                h.document.addEventListener(type, () => bubbled++);
                const event = stream === 'pointer' ? h.pointer(type, target) : stream === 'touch' ?
                    h.touch(type, target) : h.dispatch(target, type, { button: 0, pageX: 150, pageY: 150 });
                if (stream !== 'pointer') assert.equal(event.defaultPrevented, true, type);
                h.frame();
                h.isolated();
            }
            assert.equal(captured, types.length, 'document capture must execute');
            if (stream !== 'pointer') assert.equal(bubbled, 0, 'barrier must stop document bubbling');
            if (stream === 'mouse') {
                h.dispatch(target, 'mousedown', { button: 2, pageX: 150, pageY: 150 });
                h.frame(); h.isolated();
            }
        });
    }
}

test('center tap with a separate legacy touch stream triggers OK exactly once', () => {
    const h = setup();
    let ok = 0;
    for (const phase of ['down', 'move', 'up']) {
        h.pointer(`pointer${phase}`);
        h.touch({ down: 'touchstart', move: 'touchmove', up: 'touchend' }[phase]);
        h.frame(); h.isolated();
        ok += Number(h.Input.isTriggered('ok'));
        assert.equal(h.Input.dir8, 0);
    }
    h.pointer('pointerup'); // Duplicate or late releases cannot click again.
    for (let i = 0; i < 30; i++) { h.frame(); ok += Number(h.Input.isTriggered('ok')); }
    assert.equal(ok, 1);
});

test('drag returns through center and releases neutral without OK', () => {
    const h = setup();
    h.pointer('pointerdown');
    for (const [x, y, dir] of [[195, 150, 6], [105, 150, 4], [150, 105, 8], [150, 195, 2], [150, 150, 0]]) {
        h.pointer('pointermove', h.canvas, 1, x, y);
        h.frame(); h.isolated();
        assert.equal(h.Input.dir4, dir);
        assert.equal(h.Input.isTriggered('ok'), false);
    }
    h.pointer('pointerup', h.canvas);
    h.frame();
    assert.equal(h.Input.dir8, 0);
    assert.equal(h.Input.isTriggered('ok'), false);
    assert.equal(h.knob.style.transform, 'translate(-50%, -50%)');
});

test('second finger cannot steal/release stick; its button release still reaches the button', () => {
    const h = setup();
    h.pointer('pointerdown', h.knob, 1, 195);
    h.frame();
    const transform = h.knob.style.transform;
    for (const phase of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
        h.pointer(phase, h.knob, 2, 105);
        h.frame();
        assert.equal(h.Input.dir4, 6);
        assert.equal(h.knob.style.transform, transform);
        assert.equal(h.stick.hasPointerCapture(1), true);
    }
    for (const [selector, key] of [['.mtc-cancel', 'escape'], ['.mtc-pageup', 'pageup'], ['.mtc-pagedown', 'pagedown']]) {
        const button = h.document.querySelector(selector);
        h.pointer('pointerdown', button, 2); h.frame();
        assert.equal(h.Input.isPressed(key), true);
        h.pointer('pointerup', button, 2); h.frame();
        assert.equal(h.Input.isPressed(key), false);
        assert.equal(h.Input.dir4, 6);
    }
    h.pointer('pointerup', h.canvas, 1); h.frame();
    assert.equal(h.Input.dir8, 0);
    assert.equal(h.Input.isTriggered('ok'), false);
});

const resets = {
    lostpointercapture: h => h.stick.releasePointerCapture(1),
    pointercancel: h => h.pointer('pointercancel', h.canvas),
    'Input.clear': h => h.Input.clear(),
    blur: h => h.dispatch(h.window, 'blur', { bubbles: false }),
    pagehide: h => h.dispatch(h.window, 'pagehide', { bubbles: false }),
    hidden: h => { h.document.hidden = true; h.dispatch(h.document, 'visibilitychange'); }
};
for (const [name, reset] of Object.entries(resets)) {
    for (const x of [150, 195]) test(`${name}: reset ${x === 150 ? 'tap' : 'drag'} and reject stale events`, () => {
        const h = setup();
        h.pointer('pointerdown', h.knob, 1, x); h.frame();
        assert.equal(h.Input.dir4, x === 150 ? 0 : 6);
        reset(h); h.frame();
        assert.equal(h.stick.hasPointerCapture(1), false);
        for (const phase of [null, 'pointermove', 'pointerup', 'pointerup']) {
            if (phase) h.pointer(phase, h.knob, 1, 195);
            h.frame(); h.isolated();
            assert.equal(h.Input.dir8, 0);
            assert.equal(h.Input.isTriggered('ok'), false);
            assert.equal(h.knob.style.transform, 'translate(-50%, -50%)');
        }
        h.document.hidden = false;
        h.pointer('pointerdown', h.knob, 3); h.pointer('pointerup', h.knob, 3); h.frame();
        assert.equal(h.Input.isTriggered('ok'), true, 'fresh gestures still work');
        h.frame(); assert.equal(h.Input.isTriggered('ok'), false);
    });
}

test('canvas touch still sets destination, while canvas mouse cannot move the map', () => {
    const h = setup();
    h.dispatch(h.canvas, 'mousedown', { button: 0, pageX: 96, pageY: 192 }); h.frame();
    assert.equal(h.TouchInput.isTriggered(), true);
    assert.equal(h.destinations.length, 0);
    h.dispatch(h.canvas, 'mouseup', { button: 0, pageX: 96, pageY: 192 }); h.frame();
    h.touch('touchstart', h.canvas, 96, 192); h.frame();
    assert.equal(h.TouchInput.isTriggered(), true);
    assert.equal(h.TouchInput.isPressed(), true);
    assert.deepEqual(h.destinations, [[2, 4]]);
    h.touch('touchend', h.canvas, 96, 192); h.frame();
    assert.equal(h.TouchInput.isPressed(), false);
});

test('keyboard and gamepad each work without touch input', () => {
    const h = setup();
    for (const [keyCode, key] of [[37, 'left'], [13, 'ok'], [81, 'pageup'], [87, 'pagedown']]) {
        h.dispatch(h.document, 'keydown', { keyCode }); h.frame();
        assert.equal(h.Input.isTriggered(key), true);
        h.frame(); assert.equal(h.Input.isPressed(key), true);
        if (key === 'left') assert.equal(h.Input.dir4, 4);
        h.dispatch(h.document, 'keyup', { keyCode }); h.frame();
        assert.equal(h.Input.isPressed(key), false);
    }
    const pad = { index: 0, connected: true, axes: [1, 0], buttons: [{ pressed: false }] };
    h.gamepads.push(pad); h.frame(); assert.equal(h.Input.dir4, 6);
    h.frame(); assert.equal(h.Input.dir4, 6);
    pad.axes[0] = 0; pad.buttons[0].pressed = true; h.frame();
    assert.equal(h.Input.dir4, 0); assert.equal(h.Input.isTriggered('ok'), true);
    pad.buttons[0].pressed = false; h.frame(); assert.equal(h.Input.isPressed('ok'), false);
    h.isolated();
});