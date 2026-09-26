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
const movementSource = bounded(read('js/rmmz_objects.js'),
    'function Game_CharacterBase()', 'function Game_Follower()');
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

function setup(pluginParameters = { EnableDiagonalMovement: 'true' }) {
    const { window, document, dispatch } = dom();
    const gamepads = [];
    const destinations = [];
    // Stub world services, not player movement, collision, or pathfinding methods.
    const blocked = new Set(), blockedEdges = new Set(), events = [];
    const xWithDirection = (x, d) => x + (d === 6 ? 1 : d === 4 ? -1 : 0);
    const yWithDirection = (y, d) => y + (d === 2 ? 1 : d === 8 ? -1 : 0);
    const vehicle = { posNt: () => false };
    const gameMap = {
        canvasToMapX: x => Math.floor(x / 48), canvasToMapY: y => Math.floor(y / 48),
        xWithDirection, yWithDirection,
        roundXWithDirection: xWithDirection, roundYWithDirection: yWithDirection,
        isValid: (x, y) => x >= 0 && y >= 0 && x < 20 && y < 20,
        isPassable: (x, y, d) => !blocked.has(`${x},${y}`) && !blockedEdges.has(`${x},${y},${d}`),
        eventsXy: (x, y) => events.filter(event => event.x === x && event.y === y),
        eventsXyNt: (x, y) => events.filter(event => event.x === x && event.y === y && !event.through),
        boat: () => vehicle, ship: () => vehicle, vehicle: () => null,
        isLadder: () => false, isBush: () => false,
        eventRunning: false, isEventRunning() { return this.eventRunning; },
        width: () => 20, deltaX: (a, b) => a - b, deltaY: (a, b) => a - b,
        distance: (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2)
    };
    const navigator = { getGamepads: () => gamepads };
    window.navigator = navigator;
    const context = vm.createContext({ window, document, navigator, console,
        PluginManager: { parameters: name => name === 'MobileTouchControls' ? pluginParameters : {} },
        Graphics: { pageToCanvasX: x => x, pageToCanvasY: y => y, isInsideCanvas: () => true },
        $gameMap: gameMap, $dataSystem: { optTransparent: false },
        $gameMessage: { busy: false, isBusy() { return this.busy; } },
        $gameParty: { steps: 0, increaseSteps() { this.steps++; } },
        $gameTemp: { destination: null,
            setDestination(x, y) { this.destination = [x, y]; destinations.push([x, y]); },
            isDestinationValid() { return this.destination !== null; },
            destinationX() { return this.destination[0]; },
            destinationY() { return this.destination[1]; },
            isPlaytest: () => false,
            clearDestination() { this.destination = null; } } });
    vm.runInContext('function Scene_Base() {}\nScene_Base.prototype.update = function() {};\n' +
        'function Scene_Map() { this._touchCount = 0; }\n' +
        'const SceneManager = { _scene: { needsPageButtons: () => true } };', context);
    vm.runInContext(inputSource, context, { filename: 'rmmz_core.input-sections.js' });
    vm.runInContext(mapSource, context, { filename: 'rmmz_scenes.map-touch-section.js' });
    vm.runInContext(`function Game_Followers() { this.moves = []; this.gathering = false; }
        Game_Followers.prototype.areGathering = function() { return this.gathering; };
        Game_Followers.prototype.updateMove = function() {
            this.moves.push([$gamePlayer.x, $gamePlayer.y]);
        };`, context);
    vm.runInContext(movementSource, context, { filename: 'rmmz_objects.player-sections.js' });
    const originalGetInputDirection = context.Game_Player.prototype.getInputDirection;
    const originalExecuteMove = context.Game_Player.prototype.executeMove;
    for (const plugin of plugins) {
        const file = `js/plugins/${plugin.name}.js`;
        vm.runInContext(read(file), context, { filename: file });
    }
    const { Input, TouchInput } = context;
    Input.initialize();
    TouchInput.initialize();
    const player = context.$gamePlayer = new context.Game_Player();
    player.setPosition(5, 5);
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
    const settle = () => {
        for (let i = 0; player.isMoving() && i < 100; i++) player.updateMove();
        assert.equal(player.isMoving(), false, 'native movement animation finishes');
    };
    return { ...context, window, document, dispatch, gamepads, destinations, canvas, stick, knob,
        scene, frame, pointer, touch, isolated, player, blocked, blockedEdges, events, settle,
        originalGetInputDirection, originalExecuteMove };
}

for (const selector of ['.mtc-stick-knob', '.mtc-touch-blocker', '.mtc-cancel', '.mtc-pageup', '.mtc-pagedown',
    '.mtc-up', '.mtc-down', '.mtc-left', '.mtc-right']) {
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

const directions = [['up', 8], ['down', 2], ['left', 4], ['right', 6]];
const hasPressedClass = button => button.className.split(/\s+/).includes('is-pressed');
const position = player => [player.x, player.y];
const components = direction => [direction === 1 || direction === 7 ? 4 : 6,
    direction === 1 || direction === 3 ? 2 : 8];
function holdDirection(h, direction, prime = 0) {
    const offsets = { 1: [-35, 35], 2: [0, 45], 3: [35, 35], 4: [-45, 0],
        6: [45, 0], 7: [-35, -35], 8: [0, -45], 9: [35, -35] };
    const [x, y] = offsets[prime || direction];
    h.pointer('pointerdown', h.knob, 1, 150 + x, 150 + y); h.frame();
    if (prime) {
        const [dx, dy] = offsets[direction];
        h.pointer('pointermove', h.canvas, 1, 150 + dx, 150 + dy); h.frame();
    }
    assert.equal(h.Input.dir8, direction);
}
function assertSteps(h, expected, before) {
    assert.equal(h.$gameParty.steps, expected, 'one party step per successful move');
    assert.equal(h.player.followers().moves.length, expected, 'followers update once per successful move');
    // Normalize VM arrays: deepStrictEqual also compares cross-realm prototypes.
    if (before) assert.deepEqual([...h.player.followers().moves.at(-1)], before, 'followers update before player moves');
}

for (const [key, direction] of directions) {
    for (const release of ['captured outside', 'document outside', 'lost capture']) {
        test(`dpad ${key}: hold/repeat and ${release} release`, () => {
            const h = setup(), button = h.document.querySelector(`.mtc-${key}`);
            assert.equal(button.parentNode, h.stick.parentNode);
            assert.equal(button.parentNode.className, 'mtc-movement-pad');
            assert.equal(button.attributes['aria-pressed'], 'false');
            if (release === 'document outside') {
                button.setPointerCapture = () => { throw new Error('synthetic pointer'); };
            }
            h.pointer('pointerdown', button, 11); h.frame();
            assert.equal(h.Input.isTriggered(key), true);
            assert.equal(h.Input.isRepeated(key), true);
            assert.equal(hasPressedClass(button), true);
            assert.equal(button.attributes['aria-pressed'], 'true');
            h.pointer('pointermove', h.canvas, 11, 800, 800);
            h.dispatch(button, 'pointerleave', { pointerId: 99 }); // Non-owner cannot release.
            for (let frame = 1; frame <= h.Input.keyRepeatWait + h.Input.keyRepeatInterval; frame++) {
                h.frame(); h.isolated();
                assert.equal(h.Input.isPressed(key), true);
                assert.equal(h.Input.isTriggered(key), false);
                assert.equal(h.Input.dir4, direction);
                assert.equal(h.Input.dir8, direction);
                assert.equal(h.Input.isRepeated(key), frame >= h.Input.keyRepeatWait &&
                    frame % h.Input.keyRepeatInterval === 0, `repeat frame ${frame}`);
            }
            if (release === 'lost capture') button.releasePointerCapture(11);
            else h.pointer('pointerup', h.canvas, 11, 800, 800);
            h.frame(); h.isolated();
            assert.equal(h.Input.isPressed(key), false);
            assert.equal(h.Input.dir8, 0);
            assert.equal(button.hasPointerCapture(11), false);
            assert.equal(hasPressedClass(button), false);
            assert.equal(button.attributes['aria-pressed'], 'false');
            assert.equal(h.Input.isTriggered('ok'), false);
        });
    }
    test(`dpad ${key}: multiple pointer owners survive another owner's release`, () => {
        const h = setup(), button = h.document.querySelector(`.mtc-${key}`);
        h.pointer('pointerdown', button, 11);
        h.pointer('pointerdown', button, 11); // Set ownership is idempotent.
        h.pointer('pointerdown', button, 12); h.frame();
        h.pointer('pointerup', button, 99); h.frame();
        assert.equal(h.Input.dir8, direction);
        h.pointer('pointerup', h.canvas, 11); h.frame();
        assert.equal(button.hasPointerCapture(11), false);
        assert.equal(button.hasPointerCapture(12), true);
        assert.equal(h.Input.dir8, direction);
        assert.equal(hasPressedClass(button), true);
        button.releasePointerCapture(12); h.frame();
        assert.equal(h.Input.dir8, 0);
        assert.equal(hasPressedClass(button), false);
        h.pointer('pointerup', h.canvas, 12); h.frame();
        assert.equal(h.Input.isTriggered('ok'), false);
    });
    test(`dpad ${key}: cancel and uncaptured leave release only their owner`, () => {
        const h = setup(), button = h.document.querySelector(`.mtc-${key}`);
        h.pointer('pointerdown', button, 11); h.frame();
        h.dispatch(button, 'pointerleave', { pointerId: 11 }); h.frame();
        assert.equal(h.Input.dir8, direction, 'captured leave continues holding');
        h.pointer('pointercancel', h.canvas, 11); h.frame();
        assert.equal(h.Input.dir8, 0);
        button.setPointerCapture = () => { throw new Error('synthetic pointer'); };
        h.pointer('pointerdown', button, 12); h.frame();
        assert.equal(h.Input.dir8, direction);
        h.dispatch(button, 'pointerleave', { pointerId: 12 }); h.frame();
        assert.equal(h.Input.dir8, 0);
        assert.equal(button.attributes['aria-pressed'], 'false');
    });
}

for (const [key, direction] of directions) {
    for (const first of ['stick', 'button']) {
        test(`stick right + dpad ${key}: independent ownership, release ${first} first`, () => {
            const h = setup(), button = h.document.querySelector(`.mtc-${key}`);
            holdDirection(h, 6);
            h.pointer('pointerdown', button, 2); h.frame();
            assert.equal(h.Input.isPressed('right'), true);
            assert.equal(h.Input.isPressed(key), true);
            assert.equal(h.Input.dir8, { up: 9, down: 3, left: 0, right: 6 }[key]);
            const release = owner => h.pointer('pointerup', h.canvas, owner === 'stick' ? 1 : 2);
            release(first); h.frame(); h.isolated();
            assert.equal(h.Input.dir8, first === 'stick' ? direction : 6);
            assert.equal(button.hasPointerCapture(2), first === 'stick');
            assert.equal(h.stick.hasPointerCapture(1), first === 'button');
            release(first === 'stick' ? 'button' : 'stick'); h.frame();
            assert.equal(h.Input.dir8, 0);
            assert.equal(h.Input.isTriggered('ok'), false);
        });
    }
}

for (const name of ['Input.clear', 'blur', 'pagehide', 'hidden']) {
    test(`${name}: clear all dpad owners and stick, reject stale events, accept fresh input`, () => {
        const h = setup();
        const buttons = directions.map(([key]) => h.document.querySelector(`.mtc-${key}`));
        holdDirection(h, 9);
        buttons.forEach((button, i) => {
            h.pointer('pointerdown', button, 10 + i);
            h.pointer('pointerdown', button, 20 + i);
        });
        h.frame();
        for (const [key] of directions) assert.equal(h.Input.isPressed(key), true);
        resets[name](h); h.frame();
        assert.equal(h.stick.hasPointerCapture(1), false);
        buttons.forEach((button, i) => {
            assert.equal(button.hasPointerCapture(10 + i), false);
            assert.equal(button.hasPointerCapture(20 + i), false);
            assert.equal(hasPressedClass(button), false);
            assert.equal(button.attributes['aria-pressed'], 'false');
            for (const id of [10 + i, 20 + i]) {
                for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
                    h.pointer(type, button, id); h.frame();
                    assert.equal(h.Input.dir8, 0);
                    for (const [key] of directions) assert.equal(h.Input.isPressed(key), false);
                    assert.equal(h.Input.isTriggered('ok'), false);
                    h.isolated();
                }
            }
        });
        h.pointer('pointermove', h.knob, 1, 195, 195);
        h.pointer('pointerup', h.knob, 1); h.frame();
        assert.equal(h.Input.dir8, 0);
        assert.equal(h.Input.isTriggered('ok'), false);
        h.document.hidden = false;
        h.pointer('pointerdown', buttons[0], 10); h.frame();
        assert.equal(h.Input.dir8, 8, 'a previously released pointer ID can start a fresh gesture');
        h.pointer('pointerup', h.canvas, 10); h.frame();
        assert.equal(h.Input.dir8, 0);
    });
}

for (const [sector, direction] of [6, 3, 2, 1, 4, 7, 8, 9].entries()) {
    test(`stick sector ${direction}: full 45-degree width immediately outside circular dead zone`, () => {
        const h = setup();
        h.pointer('pointerdown');
        for (const radius of [24.01, 45]) {
            for (const offset of [-22.4, 0, 22.4]) {
                const angle = (sector * 45 + offset) * Math.PI / 180;
                h.pointer('pointermove', h.canvas, 1,
                    150 + radius * Math.cos(angle), 150 + radius * Math.sin(angle));
                h.frame(); h.isolated();
                assert.equal(h.Input.dir8, direction, `radius ${radius}, offset ${offset}`);
                assert.equal(h.player.getInputDirection(), direction);
                assert.ok([2, 4, 6, 8].includes(h.Input.dir4), 'menu input remains cardinal');
            }
        }
        h.pointer('pointermove', h.canvas, 1, 150, 150); h.frame();
        assert.equal(h.Input.dir8, 0);
        h.pointer('pointerup', h.canvas); h.frame();
        assert.equal(h.Input.isTriggered('ok'), false);
    });
}

test('stick dead zone includes exact axial boundary and near-diagonal interior, then center is neutral', () => {
    const h = setup();
    holdDirection(h, 9);
    for (const [dx, dy] of [[24, 0], [-24, 0], [0, 24], [0, -24],
        [16.96, 16.96], [-16.96, 16.96], [-16.96, -16.96], [16.96, -16.96], [0, 0]]) {
        h.pointer('pointermove', h.canvas, 1, 150 + dx, 150 + dy); h.frame();
        assert.equal(h.Input.dir8, 0);
        assert.equal(h.Input.dir4, 0);
        assert.equal(h.player.getInputDirection(), 0);
    }
    h.pointer('pointerup', h.canvas); h.frame();
    assert.equal(h.Input.isTriggered('ok'), false);
});

for (const direction of [1, 3, 7, 9]) {
    const [horz, vert] = components(direction);
    const dx = horz === 4 ? -1 : 1, dy = vert === 8 ? -1 : 1;
    test(`native player diagonal ${direction}: coordinates, animation gate, followers and release`, () => {
        const h = setup();
        holdDirection(h, direction);
        for (let step = 1; step <= 2; step++) {
            const before = position(h.player);
            h.player.moveByInput();
            assert.deepEqual(position(h.player), [5 + step * dx, 5 + step * dy]);
            assert.equal(h.player.isMovementSucceeded(), true);
            assert.equal(h.player.isMoving(), true);
            assertSteps(h, step, before);
            h.player.moveByInput(); // A held direction cannot step again mid-animation.
            assertSteps(h, step);
            h.settle(); h.frame();
        }
        h.pointer('pointerup', h.canvas); h.frame();
        h.player.moveByInput();
        assertSteps(h, 2);
        assert.deepEqual(position(h.player), [5 + 2 * dx, 5 + 2 * dy]);
    });

    for (const primary of [horz, vert]) {
        const prime = primary === horz ? vert : horz;
        test(`diagonal ${direction}: blocked corner never cuts through; primary ${primary} checks touch events`, () => {
            const h = setup();
            holdDirection(h, direction, prime);
            assert.equal(h.Input.dir4, primary);
            // An open diagonal destination does not permit crossing two blocked adjacent tiles.
            h.blocked.add(`${5 + dx},5`); h.blocked.add(`5,${5 + dy}`);
            let starts = 0;
            h.events.push({ x: primary === horz ? 5 + dx : 5, y: primary === vert ? 5 + dy : 5,
                isNormalPriority: () => true, isTriggerIn: triggers => triggers.includes(1),
                start() { starts++; } });
            h.player.moveByInput();
            assert.deepEqual(position(h.player), [5, 5]);
            assert.equal(h.player.isMovementSucceeded(), false);
            assert.equal(h.player.direction(), primary);
            assert.equal(starts, 1, 'native blocked straight move starts the touch event');
            assertSteps(h, 0);
        });

        for (const allowed of [horz, vert, 'both']) {
            test(`diagonal ${direction}: primary ${primary}, wall slide with ${allowed} passable`, () => {
                const h = setup();
                holdDirection(h, direction, prime);
                assert.equal(h.Input.dir4, primary);
                h.blocked.add(`${5 + dx},${5 + dy}`);
                if (allowed === horz) h.blocked.add(`5,${5 + dy}`);
                if (allowed === vert) h.blocked.add(`${5 + dx},5`);
                const selected = allowed === 'both' ? primary : allowed;
                h.player.moveByInput();
                assert.deepEqual(position(h.player), [5 + (selected === horz ? dx : 0),
                    5 + (selected === vert ? dy : 0)]);
                assert.equal(h.player.direction(), selected);
                assert.equal(h.player.isMovementSucceeded(), true);
                assertSteps(h, 1, [5, 5]);
            });
        }
    }
}

test('native collision checks reject destination entry edges and normal-priority events', () => {
    for (const obstacle of ['entry edges', 'event']) {
        const h = setup();
        holdDirection(h, 3);
        if (obstacle === 'entry edges') {
            h.blockedEdges.add('6,6,4'); h.blockedEdges.add('6,6,8');
        } else {
            h.events.push({ x: 6, y: 6, isNormalPriority: () => true });
        }
        h.player.moveByInput();
        assert.equal(Math.abs(h.player.x - 5) + Math.abs(h.player.y - 5), 1, obstacle);
        assertSteps(h, 1, [5, 5]);
    }
});

test('two dpad directions move the native player diagonally; releasing one restores straight movement', () => {
    const h = setup();
    h.pointer('pointerdown', h.document.querySelector('.mtc-up'), 11);
    h.pointer('pointerdown', h.document.querySelector('.mtc-left'), 12); h.frame();
    assert.equal(h.Input.dir8, 7);
    assert.ok([4, 8].includes(h.Input.dir4));
    h.player.moveByInput();
    assert.deepEqual(position(h.player), [4, 4]); assertSteps(h, 1, [5, 5]);
    h.settle();
    h.pointer('pointerup', h.canvas, 11); h.frame();
    h.player.moveByInput();
    assert.deepEqual(position(h.player), [3, 4]); assertSteps(h, 2, [4, 4]);
    h.settle();
    h.pointer('pointerup', h.canvas, 12); h.frame();
    h.player.moveByInput();
    assertSteps(h, 2);
});

test('diagonal movement can be disabled by plugin parameter', () => {
    for (const direction of [1, 3, 7, 9]) {
        const h = setup({ EnableDiagonalMovement: 'false' });
        holdDirection(h, direction);
        const straightDirection = h.Input.dir4;
        const [x, y] = position(h.player);
        h.player.moveByInput();
        const [expectedX, expectedY] = straightDirection === 4 ? [x - 1, y] :
            straightDirection === 6 ? [x + 1, y] :
                straightDirection === 8 ? [x, y - 1] : [x, y + 1];
        assert.deepEqual(position(h.player), [expectedX, expectedY], `input ${direction}`);
        assert.equal(h.player.isMovementSucceeded(), true);
        assertSteps(h, 1, [x, y]);
    }
});

for (const gate of ['event', 'message', 'forcing', 'followers']) {
    test(`native canMove ${gate} gate suppresses held touch movement and resumes afterward`, () => {
        const h = setup();
        holdDirection(h, 9);
        const set = value => {
            if (gate === 'event') h.$gameMap.eventRunning = value;
            if (gate === 'message') h.$gameMessage.busy = value;
            if (gate === 'forcing') h.player._moveRouteForcing = value;
            if (gate === 'followers') h.player.followers().gathering = value;
        };
        set(true);
        assert.equal(h.player.canMove(), false);
        for (let i = 0; i < 3; i++) { h.frame(); h.player.moveByInput(); }
        assert.deepEqual(position(h.player), [5, 5]); assertSteps(h, 0);
        set(false);
        assert.equal(h.player.canMove(), true);
        h.player.moveByInput();
        assert.deepEqual(position(h.player), [6, 4]); assertSteps(h, 1, [5, 5]);
    });
}

test('keyboard-only two directions stay cardinal before/after touch and while neutral stick is held', () => {
    const h = setup();
    for (const phase of ['before touch', 'after touch', 'neutral stick']) {
        h.Input.clear();
        if (phase === 'after touch') {
            holdDirection(h, 9);
            h.pointer('pointerup', h.canvas); h.frame();
        }
        if (phase === 'neutral stick') { h.pointer('pointerdown'); h.frame(); }
        h.dispatch(h.document, 'keydown', { keyCode: 39 }); h.frame();
        h.dispatch(h.document, 'keydown', { keyCode: 38 }); h.frame();
        assert.equal(h.Input.dir8, 9);
        const direction = h.originalGetInputDirection.call(h.player);
        assert.ok([6, 8].includes(direction));
        assert.equal(h.player.getInputDirection(), direction, phase);
        const before = position(h.player), steps = h.$gameParty.steps;
        h.player.moveByInput();
        assert.deepEqual(position(h.player), [before[0] + (direction === 6 ? 1 : 0),
            before[1] - (direction === 8 ? 1 : 0)]);
        assertSteps(h, steps + 1, before);
        h.settle();
    }
});

test('map-tap pathfinding retains original cardinal direction and native execution after touch release', () => {
    const h = setup();
    holdDirection(h, 9);
    h.pointer('pointerup', h.canvas); h.frame();
    h.touch('touchstart', h.canvas, 8 * 48, 8 * 48); h.frame();
    h.touch('touchend', h.canvas, 8 * 48, 8 * 48); h.frame();
    assert.deepEqual(h.$gameTemp.destination, [8, 8]);
    assert.equal(h.player.getInputDirection(), h.originalGetInputDirection.call(h.player));
    assert.equal(h.player.getInputDirection(), 0);
    const originalDirection = h.player.findDirectionTo(8, 8);
    assert.ok([2, 4, 6, 8].includes(originalDirection));
    const reference = new h.Game_Player();
    reference.setPosition(5, 5);
    h.originalExecuteMove.call(reference, originalDirection);
    h.$gameParty.steps = 0;
    h.player.moveByInput();
    assert.deepEqual(position(h.player), position(reference));
    assert.equal(Math.abs(h.player.x - 5) + Math.abs(h.player.y - 5), 1);
    assert.deepEqual(h.$gameTemp.destination, [8, 8], 'map destination remains active');
    assertSteps(h, 1, [5, 5]);
});