function Slider(options) {
	this.el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el;;
	this.slideChange = options.slideChange || function(){};

	this.wrapper = this.el.querySelector('.b-slider-wrapper');
	this.items = this.el.querySelectorAll('.b-slider-item');
	this.arrowLeft = this.el.querySelector('.b-slider-arrow_left');
	this.arrowRight = this.el.querySelector('.b-slider-arrow_right');

	this.wrapperWidth = this.wrapper.clientWidth;
	this.itemWidth = this.items[0].clientWidth;
	this.visibleCount = this.wrapperWidth / this.itemWidth;
	this.nearCount = Math.floor(this.visibleCount / 2);
	this.position = 0;

	this.itemPositions = Array.from(this.items).map((item, i) => i);

	this.arrowLeft.addEventListener('click', e => {
		e.preventDefault();
		this.slideTo(this.position - 1);
	});

	this.arrowRight.addEventListener('click', e => {
		e.preventDefault();
		this.slideTo(this.position + 1);
	});

	this.items.forEach((el, index) => {
		el.addEventListener('click', e => {
			e.preventDefault();
			this.slideTo(index);
		});
	});

	this.slideTo(0, true);
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

Slider.prototype.updateWrapperPosition = function(position) {
	this.wrapper.style.transform = 'translateX(' + (-position / this.visibleCount * 100) + '%)';
}

Slider.prototype.updateItemPosition = function(position) {
	this.getItem(position).style.transform = 'translateX(' + (this.getOffset(position) * 100) + '%)';
	this.itemPositions[this.getIndex(position)] = position;
}

Slider.prototype.getItemPosition = function(position) {
	return this.itemPositions[this.getIndex(position)];
}

Slider.prototype.slideTo = function(position, silent) {
	position = this.getItemPosition(position);

	for (var i = position - this.nearCount; i <= position + this.nearCount; i++) {
		this.updateItemPosition(i);
	}

	this.updateWrapperPosition(position - this.nearCount);

	this.getItem(this.position).classList.remove('m-active');
	this.getItem(position).classList.add('m-active');

	if (!silent) {
		this.slideChange(position, this.position);
	}
	this.position = position;
}

var previewSlider = new Slider({
	el: document.querySelector('#slider1'),
	slideChange: function(position, oldPosition) {
		thumbsSlider.slideTo(position, true);
	},
});

var thumbsSlider = new Slider({
	el: document.querySelector('#slider2'),
	slideChange: function(position, oldPosition) {
		previewSlider.slideTo(position, true);
	},
});