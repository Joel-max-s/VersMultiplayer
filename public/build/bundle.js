
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const User = writable({loggedIn: false, username: ''});
    const LoreIpsum = writable(
        `Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,`
        );

    /* src\components\Button.svelte generated by Svelte v3.44.3 */

    const file$3 = "src\\components\\Button.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", /*type*/ ctx[1]);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*style*/ ctx[0]) + " svelte-n1sijc"));
    			add_location(button, file$3, 6, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*type*/ 2) {
    				attr_dev(button, "type", /*type*/ ctx[1]);
    			}

    			if (!current || dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (!current || dirty & /*style*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*style*/ ctx[0]) + " svelte-n1sijc"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { style = "primary" } = $$props;
    	let { type = "button" } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['style', 'type', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ style, type, disabled });

    	$$self.$inject_state = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style, type, disabled, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { style: 0, type: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Login.svelte generated by Svelte v3.44.3 */

    const { console: console_1 } = globals;
    const file$2 = "src\\components\\Login.svelte";

    // (56:12) <Button disabled={btnDisabled} type="submit">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(56:12) <Button disabled={btnDisabled} type=\\\"submit\\\">",
    		ctx
    	});

    	return block;
    }

    // (59:4) {#if message}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*message*/ ctx[2]);
    			attr_dev(div, "class", "message svelte-1eqmzwx");
    			add_location(div, file$2, 59, 8, 1466);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 4) set_data_dev(t, /*message*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(59:4) {#if message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let header;
    	let h2;
    	let t1;
    	let form;
    	let div0;
    	let input;
    	let t2;
    	let button;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	button = new Button({
    			props: {
    				disabled: /*btnDisabled*/ ctx[1],
    				type: "submit",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*message*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			header = element("header");
    			h2 = element("h2");
    			h2.textContent = "HELLO";
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			create_component(button.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(h2, "class", "svelte-1eqmzwx");
    			add_location(h2, file$2, 45, 8, 1040);
    			attr_dev(header, "class", "svelte-1eqmzwx");
    			add_location(header, file$2, 44, 4, 1022);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Username");
    			attr_dev(input, "class", "svelte-1eqmzwx");
    			add_location(input, file$2, 49, 12, 1170);
    			attr_dev(div0, "class", "input-group svelte-1eqmzwx");
    			add_location(div0, file$2, 48, 8, 1131);
    			add_location(form, file$2, 47, 4, 1075);
    			add_location(div1, file$2, 43, 0, 1011);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, header);
    			append_dev(header, h2);
    			append_dev(div1, t1);
    			append_dev(div1, form);
    			append_dev(form, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*text*/ ctx[0]);
    			append_dev(div0, t2);
    			mount_component(button, div0, null);
    			append_dev(div1, t3);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*handleInput*/ ctx[3], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1 && input.value !== /*text*/ ctx[0]) {
    				set_input_value(input, /*text*/ ctx[0]);
    			}

    			const button_changes = {};
    			if (dirty & /*btnDisabled*/ 2) button_changes.disabled = /*btnDisabled*/ ctx[1];

    			if (dirty & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (/*message*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(button);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let text = "";
    	let btnDisabled = true;
    	let min = 2;
    	let message;

    	const handleInput = () => {
    		console.log(text.trim());

    		if (text.trim().length < min) {
    			$$invalidate(2, message = `Username must be at least ${min} characters`);
    			$$invalidate(1, btnDisabled = true);
    		} else {
    			$$invalidate(2, message = null);
    			$$invalidate(1, btnDisabled = false);
    		}
    	};

    	const handleSubmit = () => {
    		if (text.trim().length >= min) {
    			const newUser = {
    				// id: uuidv4(),
    				loggedIn: true,
    				username: text
    			};

    			User.update(() => newUser);
    			$$invalidate(0, text = "");
    		}
    	};

    	const socket = io('ws://localhost:3000');

    	socket.on("connect", () => {
    		socket.emit('foo');
    	});

    	socket.on("bar", msg => {
    		console.log(msg);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		text = this.value;
    		$$invalidate(0, text);
    	}

    	$$self.$capture_state = () => ({
    		User,
    		Button,
    		text,
    		btnDisabled,
    		min,
    		message,
    		handleInput,
    		handleSubmit,
    		socket
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('btnDisabled' in $$props) $$invalidate(1, btnDisabled = $$props.btnDisabled);
    		if ('min' in $$props) min = $$props.min;
    		if ('message' in $$props) $$invalidate(2, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, btnDisabled, message, handleInput, handleSubmit, input_input_handler];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Gamescreen.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\components\\Gamescreen.svelte";

    // (49:10) <Button type="submit">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Send");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(49:10) <Button type=\\\"submit\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t3;
    	let progress;
    	let t4;
    	let form;
    	let div;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t9;
    	let select1;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let t14;
    	let select2;
    	let option8;
    	let option9;
    	let option10;
    	let option11;
    	let option12;
    	let option13;
    	let option14;
    	let option15;
    	let option16;
    	let option17;
    	let option18;
    	let option19;
    	let option20;
    	let option21;
    	let option22;
    	let option23;
    	let option24;
    	let option25;
    	let option26;
    	let option27;
    	let t35;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	button = new Button({
    			props: {
    				type: "submit",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(/*$LoreIpsum*/ ctx[0]);
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Hier steht später die Zeit die noch übrig ist (vllt mit Balken?)";
    			t3 = space();
    			progress = element("progress");
    			t4 = space();
    			form = element("form");
    			div = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Buch";
    			option1 = element("option");
    			option1.textContent = "Saab";
    			option2 = element("option");
    			option2.textContent = "Mercedes";
    			option3 = element("option");
    			option3.textContent = "Audi";
    			t9 = space();
    			select1 = element("select");
    			option4 = element("option");
    			option4.textContent = "Kapitel";
    			option5 = element("option");
    			option5.textContent = "Saab";
    			option6 = element("option");
    			option6.textContent = "Mercedes";
    			option7 = element("option");
    			option7.textContent = "Audi";
    			t14 = space();
    			select2 = element("select");
    			option8 = element("option");
    			option8.textContent = "Vers";
    			option9 = element("option");
    			option9.textContent = "Vers";
    			option10 = element("option");
    			option10.textContent = "Vers";
    			option11 = element("option");
    			option11.textContent = "Vers";
    			option12 = element("option");
    			option12.textContent = "Vers";
    			option13 = element("option");
    			option13.textContent = "Vers";
    			option14 = element("option");
    			option14.textContent = "Vers";
    			option15 = element("option");
    			option15.textContent = "Vers";
    			option16 = element("option");
    			option16.textContent = "Vers";
    			option17 = element("option");
    			option17.textContent = "Vers";
    			option18 = element("option");
    			option18.textContent = "Vers";
    			option19 = element("option");
    			option19.textContent = "Vers";
    			option20 = element("option");
    			option20.textContent = "Vers";
    			option21 = element("option");
    			option21.textContent = "Vers";
    			option22 = element("option");
    			option22.textContent = "Vers";
    			option23 = element("option");
    			option23.textContent = "Vers";
    			option24 = element("option");
    			option24.textContent = "Vers";
    			option25 = element("option");
    			option25.textContent = "Vers";
    			option26 = element("option");
    			option26.textContent = "Vers";
    			option27 = element("option");
    			option27.textContent = "Vers";
    			t35 = space();
    			create_component(button.$$.fragment);
    			attr_dev(p0, "class", "versText svelte-1hiic97");
    			add_location(p0, file$1, 7, 0, 146);
    			attr_dev(p1, "class", "zeit svelte-1hiic97");
    			add_location(p1, file$1, 10, 0, 192);
    			attr_dev(progress, "id", "fortschritt");
    			attr_dev(progress, "max", "100");
    			progress.value = "20";
    			attr_dev(progress, "class", "svelte-1hiic97");
    			add_location(progress, file$1, 11, 0, 278);
    			option0.__value = "Buch";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 15, 12, 470);
    			option1.__value = "saab";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 16, 12, 518);
    			option2.__value = "mercedes";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 17, 12, 566);
    			option3.__value = "audi";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 18, 12, 622);
    			attr_dev(select0, "name", "cars");
    			attr_dev(select0, "id", "cars");
    			add_location(select0, file$1, 14, 8, 426);
    			option4.__value = "Kapitel";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 21, 12, 733);
    			option5.__value = "saab";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 22, 12, 787);
    			option6.__value = "mercedes";
    			option6.value = option6.__value;
    			add_location(option6, file$1, 23, 12, 835);
    			option7.__value = "audi";
    			option7.value = option7.__value;
    			add_location(option7, file$1, 24, 12, 891);
    			attr_dev(select1, "name", "cars");
    			attr_dev(select1, "id", "cars");
    			add_location(select1, file$1, 20, 10, 689);
    			option8.__value = "Vers1";
    			option8.value = option8.__value;
    			add_location(option8, file$1, 27, 12, 1002);
    			option9.__value = "Vers2";
    			option9.value = option9.__value;
    			add_location(option9, file$1, 28, 12, 1051);
    			option10.__value = "Vers3";
    			option10.value = option10.__value;
    			add_location(option10, file$1, 29, 12, 1100);
    			option11.__value = "Vers4";
    			option11.value = option11.__value;
    			add_location(option11, file$1, 30, 12, 1149);
    			option12.__value = "Vers5";
    			option12.value = option12.__value;
    			add_location(option12, file$1, 31, 12, 1198);
    			option13.__value = "Vers6";
    			option13.value = option13.__value;
    			add_location(option13, file$1, 32, 12, 1247);
    			option14.__value = "Vers7";
    			option14.value = option14.__value;
    			add_location(option14, file$1, 33, 12, 1296);
    			option15.__value = "Vers8";
    			option15.value = option15.__value;
    			add_location(option15, file$1, 34, 12, 1345);
    			option16.__value = "Vers9";
    			option16.value = option16.__value;
    			add_location(option16, file$1, 35, 12, 1394);
    			option17.__value = "Vers10";
    			option17.value = option17.__value;
    			add_location(option17, file$1, 36, 12, 1443);
    			option18.__value = "Vers11";
    			option18.value = option18.__value;
    			add_location(option18, file$1, 37, 12, 1493);
    			option19.__value = "Vers12";
    			option19.value = option19.__value;
    			add_location(option19, file$1, 38, 12, 1543);
    			option20.__value = "Vers13";
    			option20.value = option20.__value;
    			add_location(option20, file$1, 39, 12, 1593);
    			option21.__value = "Vers14";
    			option21.value = option21.__value;
    			add_location(option21, file$1, 40, 12, 1643);
    			option22.__value = "Vers15";
    			option22.value = option22.__value;
    			add_location(option22, file$1, 41, 12, 1693);
    			option23.__value = "Vers16";
    			option23.value = option23.__value;
    			add_location(option23, file$1, 42, 12, 1743);
    			option24.__value = "Vers17";
    			option24.value = option24.__value;
    			add_location(option24, file$1, 43, 12, 1793);
    			option25.__value = "Vers18";
    			option25.value = option25.__value;
    			add_location(option25, file$1, 44, 12, 1843);
    			option26.__value = "Vers19";
    			option26.value = option26.__value;
    			add_location(option26, file$1, 45, 12, 1893);
    			option27.__value = "Vers20";
    			option27.value = option27.__value;
    			add_location(option27, file$1, 46, 12, 1943);
    			attr_dev(select2, "name", "cars");
    			attr_dev(select2, "id", "cars");
    			add_location(select2, file$1, 26, 10, 958);
    			attr_dev(div, "class", "input-group");
    			add_location(div, file$1, 13, 4, 391);
    			add_location(form, file$1, 12, 0, 339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, progress, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, div);
    			append_dev(div, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(div, t9);
    			append_dev(div, select1);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			append_dev(div, t14);
    			append_dev(div, select2);
    			append_dev(select2, option8);
    			append_dev(select2, option9);
    			append_dev(select2, option10);
    			append_dev(select2, option11);
    			append_dev(select2, option12);
    			append_dev(select2, option13);
    			append_dev(select2, option14);
    			append_dev(select2, option15);
    			append_dev(select2, option16);
    			append_dev(select2, option17);
    			append_dev(select2, option18);
    			append_dev(select2, option19);
    			append_dev(select2, option20);
    			append_dev(select2, option21);
    			append_dev(select2, option22);
    			append_dev(select2, option23);
    			append_dev(select2, option24);
    			append_dev(select2, option25);
    			append_dev(select2, option26);
    			append_dev(select2, option27);
    			append_dev(div, t35);
    			mount_component(button, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$LoreIpsum*/ 1) set_data_dev(t0, /*$LoreIpsum*/ ctx[0]);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(progress);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(form);
    			destroy_component(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $LoreIpsum;
    	validate_store(LoreIpsum, 'LoreIpsum');
    	component_subscribe($$self, LoreIpsum, $$value => $$invalidate(0, $LoreIpsum = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gamescreen', slots, []);
    	const handleSubmit = () => null;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gamescreen> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		LoreIpsum,
    		Button,
    		handleSubmit,
    		$LoreIpsum
    	});

    	return [$LoreIpsum, handleSubmit];
    }

    class Gamescreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gamescreen",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */
    const file = "src\\App.svelte";

    // (14:1) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let gamescreen;
    	let t0;
    	let div0;
    	let t1;
    	let p;
    	let t2_value = /*$User*/ ctx[0].username + "";
    	let t2;
    	let current;
    	gamescreen = new Gamescreen({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(gamescreen.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			attr_dev(div0, "class", "break svelte-1l90xnl");
    			add_location(div0, file, 16, 2, 306);
    			add_location(p, file, 17, 2, 334);
    			attr_dev(div1, "class", "gamescreen svelte-1l90xnl");
    			add_location(div1, file, 14, 1, 262);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(gamescreen, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			append_dev(p, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$User*/ 1) && t2_value !== (t2_value = /*$User*/ ctx[0].username + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamescreen.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamescreen.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(gamescreen);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (9:1) {#if !$User.loggedIn}
    function create_if_block(ctx) {
    	let div;
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(login.$$.fragment);
    			attr_dev(div, "class", "login svelte-1l90xnl");
    			add_location(div, file, 9, 1, 210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(login, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(login);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(9:1) {#if !$User.loggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$User*/ ctx[0].loggedIn) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "container svelte-1l90xnl");
    			add_location(main, file, 7, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $User;
    	validate_store(User, 'User');
    	component_subscribe($$self, User, $$value => $$invalidate(0, $User = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Login, Gamescreen, User, $User });
    	return [$User];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
