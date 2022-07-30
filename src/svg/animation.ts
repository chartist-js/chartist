import type { EventEmitter } from '../event';
import { ensureUnit, quantity } from '../core/lang';
import type { Attributes, AnimationDefinition, AnimationEvent } from './types';
import type { Svg } from './Svg';

/**
 * This Object contains some standard easing cubic bezier curves.
 * Then can be used with their name in the `Svg.animate`.
 * You can also extend the list and use your own name in the `animate` function.
 * Click the show code button to see the available bezier functions.
 */
export const easings = {
  easeInSine: [0.47, 0, 0.745, 0.715],
  easeOutSine: [0.39, 0.575, 0.565, 1],
  easeInOutSine: [0.445, 0.05, 0.55, 0.95],
  easeInQuad: [0.55, 0.085, 0.68, 0.53],
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
  easeInCubic: [0.55, 0.055, 0.675, 0.19],
  easeOutCubic: [0.215, 0.61, 0.355, 1],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeInQuart: [0.895, 0.03, 0.685, 0.22],
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  easeInOutQuart: [0.77, 0, 0.175, 1],
  easeInQuint: [0.755, 0.05, 0.855, 0.06],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeInOutQuint: [0.86, 0, 0.07, 1],
  easeInExpo: [0.95, 0.05, 0.795, 0.035],
  easeOutExpo: [0.19, 1, 0.22, 1],
  easeInOutExpo: [1, 0, 0, 1],
  easeInCirc: [0.6, 0.04, 0.98, 0.335],
  easeOutCirc: [0.075, 0.82, 0.165, 1],
  easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
  easeInBack: [0.6, -0.28, 0.735, 0.045],
  easeOutBack: [0.175, 0.885, 0.32, 1.275],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55]
};

export function createAnimation(
  element: Svg,
  attribute: string,
  animationDefinition: AnimationDefinition,
  createGuided = false,
  eventEmitter?: EventEmitter
) {
  const { easing, ...def } = animationDefinition;
  const attributeProperties: Attributes = {};
  let animationEasing;
  let timeout;

  // Check if an easing is specified in the definition object and delete it from the object as it will not
  // be part of the animate element attributes.
  if (easing) {
    // If already an easing Bézier curve array we take it or we lookup a easing array in the Easing object
    animationEasing = Array.isArray(easing) ? easing : easings[easing];
  }

  // If numeric dur or begin was provided we assume milli seconds
  def.begin = ensureUnit(def.begin, 'ms');
  def.dur = ensureUnit(def.dur, 'ms');

  if (animationEasing) {
    def.calcMode = 'spline';
    def.keySplines = animationEasing.join(' ');
    def.keyTimes = '0;1';
  }

  // Adding "fill: freeze" if we are in guided mode and set initial attribute values
  if (createGuided) {
    def.fill = 'freeze';
    // Animated property on our element should already be set to the animation from value in guided mode
    attributeProperties[attribute] = def.from;
    element.attr(attributeProperties);

    // In guided mode we also set begin to indefinite so we can trigger the start manually and put the begin
    // which needs to be in ms aside
    timeout = quantity(def.begin || 0).value;
    def.begin = 'indefinite';
  }

  const animate = element.elem('animate', {
    attributeName: attribute,
    ...def
  });

  if (createGuided) {
    // If guided we take the value that was put aside in timeout and trigger the animation manually with a timeout
    setTimeout(() => {
      // If beginElement fails we set the animated attribute to the end position and remove the animate element
      // This happens if the SMIL ElementTimeControl interface is not supported or any other problems occurred in
      // the browser. (Currently FF 34 does not support animate elements in foreignObjects)
      try {
        // @ts-expect-error Try legacy API.
        animate._node.beginElement();
      } catch (err) {
        // Set animated attribute to current animated value
        attributeProperties[attribute] = def.to;
        element.attr(attributeProperties);
        // Remove the animate element as it's no longer required
        animate.remove();
      }
    }, timeout);
  }

  const animateNode = animate.getNode();

  if (eventEmitter) {
    animateNode.addEventListener('beginEvent', () =>
      eventEmitter.emit<AnimationEvent>('animationBegin', {
        element: element,
        animate: animateNode,
        params: animationDefinition
      })
    );
  }

  animateNode.addEventListener('endEvent', () => {
    if (eventEmitter) {
      eventEmitter.emit<AnimationEvent>('animationEnd', {
        element: element,
        animate: animateNode,
        params: animationDefinition
      });
    }

    if (createGuided) {
      // Set animated attribute to current animated value
      attributeProperties[attribute] = def.to;
      element.attr(attributeProperties);
      // Remove the animate element as it's no longer required
      animate.remove();
    }
  });
}
