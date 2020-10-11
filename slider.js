function Slider(options) {
	this.el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el;;
	this.slideChange = options.slideChange || function(){};

	this.wrapper = this.el.querySelector('.b-slider-wrapper');
	this.items = this.el.querySelectorAll('.b-slider-item');
	this.arrowLeft = this.el.querySelector('.b-slider-arrow_left');
	this.arrowRight = this.el.querySelector('.b-slider-arrow_right');

	this.transitionDuration = parseFloat(getComputedStyle(this.wrapper).transitionDuration) * 1000;

	this.wrapperWidth = this.wrapper.clientWidth;
	this.itemWidth = this.items[0].clientWidth;
	this.visibleCount = this.wrapperWidth / this.itemWidth;
	this.nearCount = Math.floor(this.visibleCount / 2);
	this.position = 0;

	this.arrowLeft.addEventListener('click', e => {
		e.preventDefault();
		this.slideToEmit(this.position - 1);
	});

	this.arrowRight.addEventListener('click', e => {
		e.preventDefault();
		this.slideToEmit(this.position + 1);
	});

	this.items.forEach((el, index) => {
		el.addEventListener('click', e => {
			e.preventDefault();
			this.slideToEmit(index);
		});
	});

	this.slideTo(0);
}

Slider.prototype.getIndex = function(position) {
	return ((position % this.items.length) + this.items.length) % this.items.length;
}

Slider.prototype.getOffset = function(position) {
	return position - this.getIndex(position);
}

Slider.prototype.getItem = function(position) {
	return this.items[this.getIndex(position)];
}

Slider.prototype.resetOffset = function() {
	this.wrapper.style.transitionDuration = '0s';
	this.slideTo(this.getIndex(this.position));
	setTimeout(() => this.wrapper.style.transition = '', 13);
} 

Slider.prototype.updateWrapperPosition = function(position) {
	this.wrapper.style.transform = 'translateX(' + (-position / this.visibleCount * 100) + '%)';
}

Slider.prototype.updateItemPosition = function(position) {
	this.getItem(position).style.transform = 'translateX(' + (this.getOffset(position) * 100) + '%)';
}

Slider.prototype.getItemPosition = function(position) {
	const thisIndex = this.getIndex(this.position);
	const nextIndex = this.getIndex(position);
	const back = (nextIndex < thisIndex ? thisIndex - nextIndex : thisIndex + (this.items.length - nextIndex));
	const forward = (nextIndex < thisIndex ? (this.items.length - thisIndex) + nextIndex : nextIndex - thisIndex);

	return this.position + (back < forward ? -back : forward);
}

Slider.prototype.slideTo = function(position) {
	position = this.getItemPosition(position);

	for (var i = position - this.nearCount; i <= position + this.nearCount; i++) {
		this.updateItemPosition(i);
	}

	this.updateWrapperPosition(position - this.nearCount);

	this.getItem(this.position).classList.remove('m-active');
	this.getItem(position).classList.add('m-active');

	this.position = position;
}

Slider.prototype.slideToEmit = function(position) {
	this.slideTo(position);
	this.slideChange(this.position);

	// clearTimeout(this.resetOffsetTimeout);
	// this.resetOffsetTimeout = setTimeout(() => this.resetOffset(), this.transitionDuration);
}

var previewSlider = new Slider({
	el: document.querySelector('#slider1'),
	slideChange: position => thumbsSlider.slideTo(position),
});

var thumbsSlider = new Slider({
	el: document.querySelector('#slider2'),
	slideChange: position => previewSlider.slideTo(position),
});