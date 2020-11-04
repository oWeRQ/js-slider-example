function withoutTransition(el, cb) {
	el.style.transitionDuration = '0s';
	cb();
	void(el.clientWidth); // force reflow
	el.style.transitionDuration = '';
}

function queryElement(el, context) {
	if (el instanceof HTMLElement)
		return el;

	if (typeof el === 'string')
		return (context || document).querySelector(el);

	return null;
}

function eventListeners(fn) {
	const listeners = [];

	fn((el, type, handler, options) => {
		el.addEventListener(type, handler, options)
		listeners.push({el, type, handler});
	});

	return () => listeners.forEach(listener => listener.el.removeEventListener(listener.type, listener.handler));
}

function prevent(fn) {
	return (e, ...args) => {
		e.preventDefault();
		fn.call(this, e, ...args);
	};
}

function touchSlideX(el, threshold, fn) {
	return eventListeners(on => {
		let touchStart;
		on(el, 'touchstart', e => {
			touchStart = e.changedTouches[0].clientX;
		});
		on(el, 'touchend', e => {
			const delta = e.changedTouches[0].clientX - touchStart;
			if (Math.abs(delta) > threshold) {
				fn(e, delta);
			}
		});
	})
}

class Slider {
	constructor(options) {
		this.el = queryElement(options.el);
		this.wrapper = queryElement(options.wrapper || '.b-slider-wrapper', this.el);
		this.prev = queryElement(options.prev || '.b-slider-arrow_left', this.el);
		this.next = queryElement(options.next || '.b-slider-arrow_right', this.el);
		this.activeClass = options.activeClass || 'm-active';
		this.slideChange = options.slideChange;
		this.touchThreshold = +options.touchThreshold || 50;
		this.position = +options.position || 0;

		this.init();
	}

	init() {
		this.items = Array.from(this.wrapper.children);

		this.transitionDuration = parseFloat(getComputedStyle(this.wrapper).transitionDuration) * 1000;
		this.visibleCount = this.wrapper.clientWidth / this.items[0].clientWidth;
		this.nearCount = Math.floor(this.visibleCount / 2);

		this.destroyClick = eventListeners(on => {
			on(this.prev, 'click', prevent(() => this.slideToEmit(this.position - 1)));
			on(this.next, 'click', prevent(() => this.slideToEmit(this.position + 1)));
			this.items.forEach((el, index) => {
				on(el, 'click', prevent(() => this.slideToEmit(index)));
			});
		});

		this.destroyTouch = touchSlideX(this.el, this.touchThreshold, (e, delta) => {
			this.slideToEmit(this.position - Math.sign(delta));
		});

		this.resetOffset();
	}

	destroy() {
		this.destroyClick();
		this.destroyTouch();
	}

	getOffset(position) {
		return Math.floor(position / this.items.length) * this.items.length;
	}

	getIndex(position) {
		return position - this.getOffset(position);
	}

	getItem(position) {
		return this.items[this.getIndex(position)];
	}

	getItemPosition(position) {
		const diff = this.getIndex(position) - this.getIndex(this.position);
		const back = (diff > 0 ? this.items.length : 0) - diff;
		const forward = (diff < 0 ? this.items.length : 0) + diff;

		return this.position + (back < forward ? -back : forward);
	}

	updateWrapperPosition(position) {
		this.wrapper.style.transform = 'translateX(' + (-position / this.visibleCount * 100) + '%)';
	}

	updateItemPosition(position) {
		this.getItem(position).style.transform = 'translateX(' + (this.getOffset(position) * 100) + '%)';
	}

	updateActive(position, state) {
		this.getItem(position).classList.toggle(this.activeClass, state);
	}

	setPosition(position) {
		for (let i = position - this.nearCount; i <= position + this.nearCount; i++) {
			this.updateItemPosition(i);
		}

		this.updateWrapperPosition(position - this.nearCount);

		this.updateActive(this.position, false);
		this.updateActive(position, true);

		this.position = position;
	}

	resetOffset() {
		withoutTransition(this.wrapper, () => this.setPosition(this.getIndex(this.position)));
	}

	slideTo(position) {
		this.setPosition(this.getItemPosition(position));

		clearTimeout(this.resetOffsetTimeout);
		this.resetOffsetTimeout = setTimeout(() => this.resetOffset(), this.transitionDuration);
	}

	slideToEmit(position) {
		this.slideTo(position);
		this.slideChange && this.slideChange(this.position);
	}
}

const previewSlider = new Slider({
	el: document.querySelector('#slider1'),
	slideChange: position => thumbsSlider.slideTo(position),
});

const thumbsSlider = new Slider({
	el: document.querySelector('#slider2'),
	slideChange: position => previewSlider.slideTo(position),
});
thumbsSlider.destroy();
thumbsSlider.init();
