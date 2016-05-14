import Ember from 'ember';
import EmberTetherComponent from 'ember-tether/components/ember-tether';

const { $, computed, run, get } = Ember;

export default EmberTetherComponent.extend({

  /* Options */

  duration: null,
  effect: 'slide', // fade, grow, slide, null
  event: 'hover', // hover, click, focus, ready, or none
  hideOn: null,
  position: 'bottom center',
  role: 'tooltip',
  showOn: null,
  tabindex: '0', // A positive integer (to enable) or -1 (to disable)
  tooltipIsVisible: false,
  type: null,

  /* Properties */

  'aria-hidden': computed.oneWay('tooltipIsVisible'),
  attachment: computed.oneWay('position'),
  attributeBindings: ['aria-hidden', 'role', 'tabindex'],
  classNameBindings: ['positionClass', 'effectClass', 'tooltipIsVisible', 'typeClass'],
  classNames: ['tooltip'],
  targetAttachment: 'top center',

  effectClass: computed(function() {
    return `tooltip-${this.get('effect')}`;
  }),

  positionClass: computed(function() {
    const dasherizedTarget = Ember.String.dasherize(this.get('position'));

    return `tooltip-${dasherizedTarget}`;
  }),

  target: computed(function() {
    const parentView = this.get('parentView');

    if (!parentView) {
      console.warn('No parentView found');

      return null;
    } else {
      return `#${parentView.get('elementId')}`;
    }
  }),

  typeClass: computed(function() {
    const type = this.get('type');

    return type ? `tooltip-${type}` : null;
  }),

  /* Private properties */

  _hideTimer: null,

  _duration: computed(function() {
    let duration = this.get('duration');

    if (typeof duration === 'number') {
      return duration;
    } else if (typeof duration === 'string') {
      let cleanDuration = parseInt(duration, 10);

      /* Remove invalid parseInt results */

      if (isNaN(cleanDuration) || !isFinite(cleanDuration)) {
        cleanDuration = null;
      }

      duration = cleanDuration;
    }

    return duration;
  }),

  _hideOn: computed(function() {
    let hideOn = this.get('hideOn');

    if (!hideOn) {
      const event  = this.get('event');

      switch (event) {
        case 'hover': hideOn = 'mouseleave'; break;
        case 'focus': hideOn = 'blur'; break;
        case 'ready': hideOn = null; break;
        default: hideOn = event; break;
      }
    }

    return hideOn;
  }),

  _showOn: computed(function() {
    let showOn = this.get('showOn');

    if (!showOn) {
      const event  = this.get('event');

      switch (event) {
        case 'hover': showOn = 'mouseenter'; break;
        default: showOn = event; break;
      }
    }

    return showOn;
  }),

  /* Methods */

  init() {
    this._super(...arguments);
  },

  didInsertElement() {
    this._super(...arguments);

    const event = this.get('event');

    if (event !== 'none') {
      const _hideOn = this.get('_hideOn');
      const _showOn = this.get('_showOn');
      const $target = $(this.get('target'));

      /* If show and hide are the same (e.g. click), toggle
      the visibility */

      if (_showOn === _hideOn) {
        $target.on(_showOn, () => {
          this.toggleProperty('tooltipIsVisible');
        });
      } else {

        /* Else, add the show and hide events individually */

        if (_showOn !== 'none') {
          $target.on(_showOn, () => {
            this.set('tooltipIsVisible', true);
          });
        }

        if (_hideOn !== 'none') {
          $target.on(_hideOn, () => {
            this.set('tooltipIsVisible', false);
          });
        }
      }

      /* Hide and show the tooltip on focus and escape
      for acessibility */

      if (event !== 'focus') {
        $target.focusin(() => {
          this.set('tooltipIsVisible', true);
        });

        $target.focusout(() => {
          this.set('tooltipIsVisible', false);
        });
      }

      $target.keydown((keyEvent) => {
        if (keyEvent.which === 27) {
          this.set('tooltipIsVisible', false);
          keyEvent.preventDefault();

          return false;
        }
      });
    }
  },

  didReceiveAttrs() {
    this._super(...arguments);

    if (this.get('isDestroying')) {
      return;
    }

    const tooltipIsVisible = this.get('tooltipIsVisible');

    if (tooltipIsVisible) {
      const _duration = this.get('_duration');

      run.cancel(this.get('_hideTimer'));

      if (_duration) {

        /* Hide tooltip after specified duration */

        const hideTimer = run.later(() => {
          this.set('tooltipIsVisible', false);
        }, _duration);

        /* Save timer ID for cancelling should an event
        hide the tooltop before the duration */

        this.set('_hideTimer', hideTimer);
      }
    }
  },

  willDestroy() {
    this._super(...arguments);

    const $target = $(this.get('target'));

    this.set('effect', null);
    this.set('tooltipIsVisible', false);

    $target.removeAttr('aria-describedby');
    $target.off();
  },

});
