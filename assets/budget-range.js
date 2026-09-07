(function () {
  "use strict";

  // Shared slider/input behaviour for the home search and housing filter.
  window.createBudgetRange = function (root) {
    var lower = root.querySelector('[data-budget-input="min"]');
    var upper = root.querySelector('[data-budget-input="max"]');
    var lowerSlider = root.querySelector('[data-budget-slider="min"]');
    var upperSlider = root.querySelector('[data-budget-slider="max"]');
    var output = root.querySelector('[data-budget-output]');
    var floor = Number(lowerSlider.min);
    var ceiling = Number(upperSlider.max);
    var step = Number(lowerSlider.step);
    var defaults = { min: Number(lowerSlider.defaultValue), max: Number(upperSlider.defaultValue) };
    var value = { min: defaults.min, max: defaults.max };

    function snap(raw, fallback) {
      var number = raw === "" || raw == null ? fallback : Number(raw);
      if (!Number.isFinite(number)) number = fallback;
      return Math.max(floor, Math.min(ceiling, Math.round(number / step) * step));
    }

    function render() {
      lowerSlider.value = String(value.min);
      upperSlider.value = String(value.max);
      if (lower) lower.value = String(value.min);
      if (upper) upper.value = String(value.max);
      if (output) output.textContent = value.min.toLocaleString('zh-TW') + '～' + value.max.toLocaleString('zh-TW') + ' 元';
      root.style.setProperty('--budget-start', ((value.min - floor) / (ceiling - floor) * 100) + '%');
      root.style.setProperty('--budget-end', ((value.max - floor) / (ceiling - floor) * 100) + '%');
      lowerSlider.setAttribute('aria-valuetext', value.min.toLocaleString('zh-TW') + ' 元／月');
      upperSlider.setAttribute('aria-valuetext', value.max.toLocaleString('zh-TW') + ' 元／月');
      lowerSlider.setAttribute('aria-valuemax', String(value.max));
      upperSlider.setAttribute('aria-valuemin', String(value.min));
      // Keep a coincident handle reachable at either end of the track.
      lowerSlider.style.zIndex = value.min === ceiling ? '3' : '2';
      upperSlider.style.zIndex = value.min === ceiling ? '2' : '3';
    }

    function commit(side, input) {
      var next = snap(input.value, value[side]);
      value[side] = side === 'min' ? Math.min(next, value.max) : Math.max(next, value.min);
      render();
    }

    [[lower, lowerSlider, 'min'], [upper, upperSlider, 'max']].forEach(function (controls) {
      var input = controls[0], slider = controls[1], side = controls[2];
      slider.addEventListener('input', function () { commit(side, slider); });
      if (!input) return;
      input.addEventListener('input', function () {
        // Let the user finish typing before rounding a partial value.
        var next = Number(input.value);
        if (input.value !== '' && input.validity.valid && next % step === 0 &&
            (side === 'min' ? next <= value.max : next >= value.min)) {
          commit(side, input);
        }
      });
      input.addEventListener('change', function () { commit(side, input); });
      input.addEventListener('blur', function () { commit(side, input); });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') commit(side, input);
      });
    });

    function set(min, max) {
      var start = snap(min, defaults.min), end = snap(max, defaults.max);
      value = { min: Math.min(start, end), max: Math.max(start, end) };
      render();
    }

    render();
    return {
      get: function () { return { min: value.min, max: value.max }; },
      set: set,
      reset: function () { set(defaults.min, defaults.max); }
    };
  };
}());
