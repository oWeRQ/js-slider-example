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

function getRepeat(arr, position) {
	return arr[getIndex(arr.length, position)];
}

function getLast(arr) {
	return arr[arr.length - 1];
}

function getFillCount(total, fill, val) {
	let i;
	for (i = 1; i <= total && val(i) < fill; i++);
	return i;
}

function getRange(start, end) {
	const range = [];
	for (let i = start; i <= end; i++) {
		range.push(i);
	}
	return range;
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
		this.items = Array.from(this.wrapper.children).map(el => ({
			el,
			size: el.clientWidth,
			start: el.offsetLeft,
			end: el.offsetLeft + el.clientWidth,
		}));
		this.totalSize = getLast(this.items).end;
		this.wrapperSize = this.wrapper.clientWidth;

		this.destroyClick = eventListeners(on => {
			on(this.prev, 'click', prevent(() => this.slideToEmit(this.position - 1)));
			on(this.next, 'click', prevent(() => this.slideToEmit(this.position + 1)));
			this.items.forEach((item, index) => {
				on(item.el, 'click', prevent(() => this.slideToEmit(index)));
			});
		});

		this.destroyTouch = touchSlideX(this.el, this.touchThreshold, (e, delta) => {
			this.slideToEmit(this.position - Math.sign(delta));
		});

		this.setActiveItem = activeClass(this.activeClass);

		this.scheduleResetOffset = singleTimeout(() => this.resetOffset(), transitionDuration(this.wrapper));
		this.resetOffset();
	}

	destroy() {
		this.destroyClick();
		this.destroyTouch();
	}

	getItem(position) {
		return getRepeat(this.items, position);
	}

	getItemStart(position) {
		return this.getRepeatOffset(position) + this.getItem(position).start;
	}

	getItemEnd(position) {
		return this.getRepeatOffset(position) + this.getItem(position).end;
	}

	getItemPosition(position) {
		return this.position + getDirection(this.items.length, this.position, position);
	}

	getCenterOffset(position) {
		return this.wrapperSize / 2 - this.getItem(position).size / 2;
	}

	getRepeatOffset(position) {
		return Math.floor(position / this.items.length) * this.totalSize;
	}

	getVisiblePrev(position) {
		const fill = this.getCenterOffset(position);
		const start = this.getItemStart(position);
		return getFillCount(this.items.length, fill, i => start - this.getItemStart(position - i));
	}

	getVisibleNext(position) {
		const fill = this.getCenterOffset(position);
		const end = this.getItemEnd(position);
		return getFillCount(this.items.length, fill, i => this.getItemEnd(position + i) - end);
	}

	getVisibleRange(position) {
		return getRange(position - this.getVisiblePrev(position), position + this.getVisibleNext(position));
	}

	updateWrapperPosition(position) {
		const translateX = -this.getItemStart(position) + this.getCenterOffset(position) + 'px';
		this.wrapper.style.transform = 'translateX(' + translateX + ')';
	}

	updateItemPosition(position) {
		const translateX = this.getRepeatOffset(position) + 'px';
		this.getItem(position).el.style.transform = 'translateX(' + translateX + ')';
	}

	setPosition(position) {
		this.getVisibleRange(position).forEach(i => this.updateItemPosition(i));
		this.updateWrapperPosition(position);

		this.setActiveItem(this.getItem(position).el);

		this.position = position;
	}

	resetOffset() {
		withoutTransition(this.wrapper, () => this.setPosition(getIndex(this.items.length, this.position)));
	}

	slideTo(position) {
		this.setPosition(this.getItemPosition(position));
		this.scheduleResetOffset();
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
