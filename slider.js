function withoutTransition(el, fn) {
	el.style.transitionDuration = '0s';
	fn();
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
	return e => {
		e.preventDefault();
		return fn.call(this, e);
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

function transitionDuration(el) {
	return parseFloat(getComputedStyle(el).transitionDuration) * 1000;
}

function getOffset(total, position) {
	return Math.floor(position / total) * total;
}

function getIndex(total, position) {
	return position - getOffset(total, position);
}

function getDirection(total, prev, next) {
	const diff = getIndex(total, next) - getIndex(total, prev);
	const back = (diff > 0 ? total : 0) - diff;
	const forward = (diff < 0 ? total : 0) + diff;
	return (back < forward ? -back : forward);
}

function singleTimeout(fn, delay) {
	let timeout;
	return () => {
		timeout && clearTimeout(timeout);
		timeout = setTimeout(fn, delay);
	};
}

function activeClass(className) {
	let active;
	return (el) => {
		if (el !== active) {
			active && active.classList.remove(className);
			el && el.classList.add(className);
			active = el;
		}
	};
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

		this.widths = this.items.map(item => item.clientWidth);
		this.offsets = this.items.map(item => item.offsetLeft);
		this.totalWidth = this.offsets[this.offsets.length - 1] + this.widths[this.widths.length - 1];

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

		this.setActiveItem = activeClass(this.activeClass);

		this.sheduleResetOffset = singleTimeout(() => this.resetOffset(), transitionDuration(this.wrapper));
		this.resetOffset();
	}

	destroy() {
		this.destroyClick();
		this.destroyTouch();
	}

	getItemElement(position) {
		return this.items[getIndex(this.items.length, position)];
	}

	getItemPosition(position) {
		return this.position + getDirection(this.items.length, this.position, position);
	}

	getRepeatOffset(position) {
		return Math.floor(position / this.items.length) * this.totalWidth;
	}

	getItemOffset(position) {
		return this.getRepeatOffset(position) + this.offsets[getIndex(this.items.length, position)];
	}

	getItemWidth(position) {
		return this.widths[getIndex(this.items.length, position)];
	}

	getCenterOffset(position) {
		return this.wrapper.clientWidth / 2 - this.getItemWidth(position) / 2;
	}

	updateWrapperPosition(position) {
		const translateX = -this.getItemOffset(position) + this.getCenterOffset(position) + 'px';
		this.wrapper.style.transform = 'translateX(' + translateX + ')';
	}

	updateItemPosition(position) {
		const translateX = this.getRepeatOffset(position) + 'px';
		this.getItemElement(position).style.transform = 'translateX(' + translateX + ')';
	}

	setPosition(position) {
		this.updateItemPosition(position);

		const fillWidth = this.getCenterOffset(position);
		if (fillWidth) {
			for (let i = position - 1, width = 0; width < fillWidth; i--) {
				width += this.getItemWidth(i);
				this.updateItemPosition(i);
			}

			for (let i = position + 1, width = 0; width < fillWidth; i++) {
				width += this.getItemWidth(i);
				this.updateItemPosition(i);
			}
		}

		this.updateWrapperPosition(position);

		this.setActiveItem(this.getItemElement(position));

		this.position = position;
	}

	resetOffset() {
		withoutTransition(this.wrapper, () => this.setPosition(getIndex(this.items.length, this.position)));
	}

	slideTo(position) {
		this.setPosition(this.getItemPosition(position));
		this.sheduleResetOffset();
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

console.assert(getIndex(6, -12) === 0);
console.assert(getIndex(6, -1) === 5);
console.assert(getIndex(6, 7) === 1);
console.assert(getIndex(6, 12) === 0);

console.assert(getDirection(5, 0, 2) === 2);
console.assert(getDirection(5, 0, 3) === -2);
console.assert(getDirection(5, 0, 5) === 0);

console.assert(getDirection(5, 3, 1) === -2);
console.assert(getDirection(5, 3, 3) === 0);
console.assert(getDirection(5, 3, 5) === 2);

console.assert(getDirection(6, 0, 3) === 3);
console.assert(getDirection(6, 0, 4) === -2);
console.assert(getDirection(6, 0, 6) === 0);

console.assert(getDirection(6, 3, 0) === 3);
console.assert(getDirection(6, 3, 1) === -2);
console.assert(getDirection(6, 3, 3) === 0);
