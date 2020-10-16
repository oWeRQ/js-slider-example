function Slider(options) {
	this.el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el;
	this.slideChange = options.slideChange;
	this.activeClass = options.activeClass || 'm-active';
	this.touchThreshold = +options.touchThreshold || 50;
	this.position = +options.position || 0;

	this.init();
}

Slider.prototype.init = function() {
	this.initElements();
	this.initListeners();
	this.resetOffset();
	this.updateActive(this.position, true)
}

Slider.prototype.destroy = function() {
	this.destroyListeners();
	this.updateActive(this.position, false)
}

Slider.prototype.initElements = function() {
	this.wrapper = this.el.querySelector('.b-slider-wrapper');
	this.items = Array.from(this.el.querySelectorAll('.b-slider-item'));
	this.arrowLeft = this.el.querySelector('.b-slider-arrow_left');
	this.arrowRight = this.el.querySelector('.b-slider-arrow_right');

	this.transitionDuration = parseFloat(getComputedStyle(this.wrapper).transitionDuration) * 1000;

	this.wrapperWidth = this.wrapper.clientWidth;
	this.itemWidth = this.items[0].clientWidth;
	this.visibleCount = this.wrapperWidth / this.itemWidth;
	this.nearCount = Math.floor(this.visibleCount / 2);
}

Slider.prototype.initListeners = function() {
	this.arrowLeft.addEventListener('click', this.arrowLeftHandler = e => {
		e.preventDefault();
		this.slideToEmit(this.position - 1);
	});

	this.arrowRight.addEventListener('click', this.arrowRightHandler = e => {
		e.preventDefault();
		this.slideToEmit(this.position + 1);
	});

	this.itemsHandlers = this.items.map((el, index) => {
		const handler = e => {
			e.preventDefault();
			this.slideToEmit(index);
		};
		el.addEventListener('click', handler);
		return handler;
	});

	let touchStartX;
	this.el.addEventListener('touchstart', this.touchstartHandler = e => {
		touchStartX = e.changedTouches[0].clientX;
	});
	this.el.addEventListener('touchend', this.touchendHandler = e => {
		const deltaX = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(deltaX) > this.touchThreshold) {
			this.slideToEmit(this.position - Math.sign(deltaX));
		}
	});
}

Slider.prototype.destroyListeners = function() {
	this.arrowLeft.removeEventListener('click', this.arrowLeftHandler);
	this.arrowRight.removeEventListener('click', this.arrowRightHandler);
	this.itemsHandlers.forEach((handler, i) => {
		this.items[i].removeEventListener('click', handler);
	});
	this.el.removeEventListener('touchstart', this.touchstartHandler);
	this.el.removeEventListener('touchend', this.touchendHandler);
}

Slider.prototype.getOffset = function(position) {
	return Math.floor(position / this.items.length) * this.items.length;
}

Slider.prototype.getIndex = function(position) {
	return position - this.getOffset(position);
}

Slider.prototype.getItem = function(position) {
	return this.items[this.getIndex(position)];
}

Slider.prototype.getItemPosition = function(position) {
	const diff = this.getIndex(position) - this.getIndex(this.position);
	const back = (diff < 0 ? 0 : this.items.length) - diff;
	const forward = (diff < 0 ? this.items.length : 0) + diff;

	return this.position + (back < forward ? -back : forward);
}

Slider.prototype.updateWrapperPosition = function(position) {
	this.wrapper.style.transform = 'translateX(' + (-position / this.visibleCount * 100) + '%)';
}

Slider.prototype.updateItemPosition = function(position) {
	this.getItem(position).style.transform = 'translateX(' + (this.getOffset(position) * 100) + '%)';
}

Slider.prototype.updateActive = function(position, state) {
	this.getItem(position).classList.toggle(this.activeClass, state);
}

Slider.prototype.setPosition = function(position) {
	for (var i = position - this.nearCount; i <= position + this.nearCount; i++) {
		this.updateItemPosition(i);
	}

	this.updateWrapperPosition(position - this.nearCount);

	this.position = position;
}

Slider.prototype.resetOffset = function() {
	this.wrapper.style.transitionDuration = '0s';
	this.setPosition(this.getIndex(this.position));
	void(this.wrapper.clientWidth); // force reflow
	this.wrapper.style.transitionDuration = '';
}

Slider.prototype.slideTo = function(position) {
	this.updateActive(this.position, false);
	this.updateActive(position, true);

	this.setPosition(this.getItemPosition(position));

	clearTimeout(this.resetOffsetTimeout);
	this.resetOffsetTimeout = setTimeout(() => this.resetOffset(), this.transitionDuration);
}

Slider.prototype.slideToEmit = function(position) {
	this.slideTo(position);
	this.slideChange && this.slideChange(this.position);
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
