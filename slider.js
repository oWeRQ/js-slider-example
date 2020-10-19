function withoutTransition(el, cb) {
	el.style.transitionDuration = '0s';
	cb();
	void(el.clientWidth); // force reflow
	el.style.transitionDuration = '';
}

class Slider {
	constructor(options) {
		this.el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el;
		this.slideChange = options.slideChange;
		this.activeClass = options.activeClass || 'm-active';
		this.wrapperClass = options.wrapperClass || '.b-slider-wrapper';
		this.itemClass = options.itemClass || '.b-slider-item';
		this.prevClass = options.prevClass || '.b-slider-arrow_left';
		this.nextClass = options.nextClass || '.b-slider-arrow_right';
		this.touchThreshold = +options.touchThreshold || 50;
		this.position = +options.position || 0;

		this.init();
	}

	init() {
		this.initElements();
		this.initClick();
		this.initTouch();
		this.resetOffset();
	}

	destroy() {
		this.destroyClick();
		this.destroyTouch();
	}

	initElements() {
		this.wrapper = this.el.querySelector(this.wrapperClass);
		this.items = Array.from(this.el.querySelectorAll(this.itemClass));
		this.prev = this.el.querySelector(this.prevClass);
		this.next = this.el.querySelector(this.nextClass);

		this.transitionDuration = parseFloat(getComputedStyle(this.wrapper).transitionDuration) * 1000;
		this.visibleCount = this.wrapper.clientWidth / this.items[0].clientWidth;
		this.nearCount = Math.floor(this.visibleCount / 2);
	}

	initClick() {
		this.prev.addEventListener('click', this.prevListener = e => {
			e.preventDefault();
			this.slideToEmit(this.position - 1);
		});
		this.next.addEventListener('click', this.nextListener = e => {
			e.preventDefault();
			this.slideToEmit(this.position + 1);
		});
		this.itemsListeners = this.items.map((el, index) => {
			const listener = e => {
				e.preventDefault();
				this.slideToEmit(index);
			};
			el.addEventListener('click', listener);
			return listener;
		});
	}

	destroyClick() {
		this.prev.removeEventListener('click', this.prevListener);
		this.next.removeEventListener('click', this.nextListener);
		this.itemsListeners.forEach((listener, i) => {
			this.items[i].removeEventListener('click', listener);
		});
	}

	initTouch() {
		let touchStartX;
		this.el.addEventListener('touchstart', this.touchstartListener = e => {
			touchStartX = e.changedTouches[0].clientX;
		});
		this.el.addEventListener('touchend', this.touchendListener = e => {
			const deltaX = e.changedTouches[0].clientX - touchStartX;
			if (Math.abs(deltaX) > this.touchThreshold) {
				this.slideToEmit(this.position - Math.sign(deltaX));
			}
		});
	}

	destroyTouch() {
		this.el.removeEventListener('touchstart', this.touchstartListener);
		this.el.removeEventListener('touchend', this.touchendListener);
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
		const back = (diff < 0 ? 0 : this.items.length) - diff;
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
		for (var i = position - this.nearCount; i <= position + this.nearCount; i++) {
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

var previewSlider = new Slider({
	el: document.querySelector('#slider1'),
	slideChange: position => thumbsSlider.slideTo(position),
});

var thumbsSlider = new Slider({
	el: document.querySelector('#slider2'),
	slideChange: position => previewSlider.slideTo(position),
});
thumbsSlider.destroy();
thumbsSlider.init();
