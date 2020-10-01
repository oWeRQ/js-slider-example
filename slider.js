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

Slider.prototype.getItem = function(position) {
	return this.items[this.getIndex(position)];
}

Slider.prototype.updateItemPosition = function(position) {
	this.getItem(position).style.transform = 'translateX(' + ((position - this.getIndex(position)) * 100) + '%)';
}

Slider.prototype.updateWrapperPosition = function(position) {
	this.wrapper.style.transform = 'translateX(' + (-position / this.visibleCount * 100) + '%)';
}

Slider.prototype.slideTo = function(nextPosition, silent) {
	for (var i = nextPosition - this.nearCount; i <= nextPosition + this.nearCount; i++) {
		this.updateItemPosition(i);
	}

	this.updateWrapperPosition(nextPosition - this.nearCount);

	this.getItem(this.position).classList.remove('m-active');
	this.getItem(nextPosition).classList.add('m-active');

	if (!silent) {
		this.slideChange(nextPosition, this.position);
	}
	this.position = nextPosition;
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