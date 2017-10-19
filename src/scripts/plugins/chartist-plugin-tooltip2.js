/**
 * Chartist.js plugin to display a tooltip on top of a chart.
 * @author  Antonia Ciocodeica
 * @version 0.3 25 Nov 2016
 */
(function(window, document, Chartist) {
    'use strict';

    var startId = 0;

    var publicOptions = {
        cssClass: 'chartist-tooltip',
        offset: {
            x: 5,
            y: 0,
        },

        // Value transform function
        // It receives a single argument that contains the current value
        // "this" is the current chart
        // It must return the formatted value to be added in the tooltip (eg: currency format)
        valueTransformFunction: null,
        xValueTransformFunction: null,

        // Markup to use as a template for the content of the tooltip
        template: '<p>{{meta}}: {{value}}</p>',

        // If you choose to reverse the original order of the chart elements in
        // the DOM, you must set this to true
        dataDrawnReversed: false,

        // only if a custom element is used for the trigger (TODO: test)
        triggerSelector: null,

        id: null,
    };

    Chartist.plugins = Chartist.plugins || {};

    Chartist.plugins.tooltip2 = function(options) {
        options = Chartist.extend({}, publicOptions, options);

        /**
         * Chartist tooltip plugin
         * @param Chart chart
         */
        return function tooltip(chart) {
            startId ++;

            // simple unique id for the tooltip element (needed to be able to
            // add aria-describedby to the trigger while the tooltip is visible)
            options.id = 'charttooltip-' + startId;
            var triggerSelector = getTriggerSelector();
            var hoverClass = getDefaultTriggerClass() + '--hover';
            var pointValues = getPointValues();
            var chartRect;
            var axisY;

            var tooltipElements = [];
            var axisTooltips = {};

            init();

            /**
             * Initialize the tooltip
             */
            function init() {
                if (!chart.container) {
                    return;
                }

                // set attribute on the container, so external scripts can detect the tooltip elements
                chart.container.setAttribute('data-charttooltip-id', options.id);

                // Offer support for multiple series line charts
                if (chart instanceof Chartist.Line) {
                    chart.on('created', function() {
                        chart.container.querySelector('svg').addEventListener('mousemove', prepareLineTooltips);
                        chart.container.addEventListener('mouseleave', function(e) {
                            hideTooltips();
                        });
                    });

                    return;
                }
            }

            /**
             * Prepare tooltips
             * Calculates the closest point on the line according to the current position of the mouse
             * @param Event e
             */
            function prepareLineTooltips(e) {
                var boxData = this.getBoundingClientRect();
                var currentXPosition = e.pageX - (boxData.left + (document.documentElement.scrollLeft || document.body.scrollLeft));
                var currentYPosition = e.pageY - (boxData.top + (document.documentElement.scrollTop || document.body.scrollTop));
                var closestPointsOnX = pointValues.map(function(pv) {
                    return getClosestPointFromArray(currentXPosition, pv);
                });

                if (currentYPosition < chartRect.y2) {
                    currentYPosition = chartRect.y2;
                }

                if (currentYPosition > chartRect.y1) {
                    currentYPosition = chartRect.y1;
                }

                showTooltips(closestPointsOnX);
                showAxisTooltips(closestPointsOnX[0].pixelX, currentYPosition, {
                    x: closestPointsOnX[0].x,
                    y: axisY.projectPixel(currentYPosition - chartRect.y2)
                });
            }

            /**
             * Show tooltip
             * @param array of the closest points on the plots
             */
            function showTooltips(points) {
                var meta;

                if (!points) {
                    return;
                }

                points.map(function(point, i) {
                    return {point: point, i: i}
                })
                .filter(function(p) {
                    return p.point;
                })
                .sort(function(a, b) {
                    return a.point.y - b.point.y;
                })
                .reduce(function(prev, p) {
                    var point = p.point;
                    var i = p.i;
                    var tooltipElement = getTooltipElement(i);
                    var textMarkup = options.template;
                    var value = point.y;

                    if (typeof options.valueTransformFunction === 'function') {
                        value = options.valueTransformFunction.call(chart, value);
                    }

                    // value
                    textMarkup = textMarkup.replace(new RegExp('{{value}}', 'gi'), value);

                    tooltipElement.innerHTML = textMarkup;
                    tooltipElement.removeAttribute('hidden');
                    var posY = point.pixelY;

                    if (posY > prev) {
                        posY = prev;
                    }

                    setTooltipPosition(i, chart.container,
                        {
                            x: point.pixelX,
                            y: posY
                        }
                    );

                    return posY - 20;
                }, Infinity);
            }

            /**
             * Show axis tooltips
             * @param x pointer coordinate relative to the chart element
             * @param y pointer coordinate relative to the chart element
             */
            function showAxisTooltips(x, y, point) {
                var xTooltipElement = getAxisTooltipElement('x');
                var yTooltipElement = getAxisTooltipElement('y');
                var value = point.y;
                var xvalue = point.x;

                if (typeof options.valueTransformFunction === 'function') {
                    value = options.valueTransformFunction.call(chart, value);
                }

                if (typeof options.xValueTransformFunction === 'function') {
                    xvalue = options.xValueTransformFunction.call(chart, xvalue);
                }

                xTooltipElement.innerHTML = xvalue;
                xTooltipElement.removeAttribute('hidden');
                setAxisTooltipPosition(xTooltipElement, chart.container,
                    {
                        x: x,
                        y: chartRect.y1 + 1
                    }, false, true
                );

                yTooltipElement.innerHTML = value;
                yTooltipElement.removeAttribute('hidden');

                setAxisTooltipPosition(yTooltipElement, chart.container,
                    {
                        x: 0,
                        y: y
                    }, true
                );

                yTooltipElement.style.width = chartRect.x1;
            }

            /**
             * Hide tooltip
             * @param number the id of tooltip to hide
             */
            function hideTooltip(id) {
                var tooltipElement = tooltipElements[id];
                tooltipElement.setAttribute('hidden', true);
            }

            /**
             * Hide tooltips
             */
            function hideTooltips() {
                tooltipElements.forEach(function (el, i) {
                    hideTooltip(i);
                });

                Object.keys(axisTooltips).forEach(function (key) {
                    axisTooltips[key].setAttribute('hidden', true);
                })
            }

            /**
             * Get tooltip element
             * @return Element
             */
            function getTooltipElement(index) {
                var tooltipElement = document.getElementById(options.id + '-' + index);

                if (!tooltipElement) {
                    tooltipElement = createTooltipElement(index);
                    tooltipElements[index] = tooltipElement;
                    setTooltipPosition(index, chart.container, {x:0, y: 0}, true);
                }

                return tooltipElement;
            }

            /**
             * Get tooltip element
             * @return Element
             */
            function getAxisTooltipElement(axisId) {
                var tooltipElement = document.getElementById(options.id + '-axis-' + axisId);

                if (!tooltipElement) {
                    tooltipElement = createAxisTooltipElement(axisId);
                    axisTooltips[axisId] = tooltipElement;
                    setAxisTooltipPosition(tooltipElement, chart.container, {x:0, y: 0}, true);
                }

                return tooltipElement;
            }

            /**
             * Create tooltip element
             * @return Element
             */
            function createAxisTooltipElement(axisId) {
                var tooltipElement = document.createElement('div');

                tooltipElement.innerHTML = options.template;

                tooltipElement.classList.add('ct-axis-tooltip-'+axisId);

                tooltipElement.id = options.id + '-axis-' + axisId;

                tooltipElement.setAttribute('role', 'tooltip');
                tooltipElement.setAttribute('hidden', 'true');

                chart.container.appendChild(tooltipElement);

                return tooltipElement;
            }

            /**
             * Create tooltip element
             * @return Element
             */
            function createTooltipElement(index) {
                var tooltipElement = document.createElement('div');

                tooltipElement.innerHTML = options.template;

                tooltipElement.classList.add(options.cssClass);
                tooltipElement.classList.add('ct-line');
                tooltipElement.classList.add('ct-series-'+ String.fromCharCode(('a'.charCodeAt() + index)));

                tooltipElement.id = options.id + '-' + index;

                tooltipElement.setAttribute('role', 'tooltip');
                tooltipElement.setAttribute('hidden', 'true');

                chart.container.appendChild(tooltipElement);

                return tooltipElement;
            }

            /**
             * Set tooltip position
             * @param Element relativeElement
             */
            function setTooltipPosition(index, relativeElement, offset) {
                var tooltipElement = tooltipElements[index];
                var positionData = getTooltipPosition(tooltipElement, relativeElement, offset, true);

                tooltipElement.style.transform = 'translate(' + Math.round(positionData.left) + 'px, ' + Math.round(positionData.top) + 'px)';
            }

            /**
             * Set axis tooltip position
             * @param Element relativeElement
             */
            function setAxisTooltipPosition(tooltipElement, relativeElement, offset, vAlign, hAlign) {
                var positionData = getTooltipPosition(tooltipElement, relativeElement, offset, vAlign, hAlign);

                positionData.left -= options.offset.x;

                tooltipElement.style.transform = 'translate(' + Math.round(positionData.left) + 'px, ' + Math.round(positionData.top) + 'px)';
            }

            /**
             * Get tooltip position relative to an element
             * @param Element relativeElement
             * @return Object positionData
             */
            function getTooltipPosition(tooltipElement, relativeElement, offset, verticalAlign, horizontalAlign) {
                var positionData = {
                    alignment: 'center',
                };
                var width = tooltipElement.offsetWidth;
                var height = tooltipElement.offsetHeight;

                var boxData = relativeElement.getBoundingClientRect();
                var left = boxData.left + offset.x + window.scrollX - (horizontalAlign ? width/2 : 0) + options.offset.x;//+ boxData.width / 2;
                var top = boxData.top + offset.y + window.scrollY - (verticalAlign ? height/2 : 0) + options.offset.y;

                positionData.left = left;
                positionData.top = top;

                return positionData;
            }

            /**
             * Get trigger selector
             * @return String The selector of the element that should trigger the tooltip
             */
            function getTriggerSelector() {
                if (options.triggerSelector) {
                    return options.triggerSelector;
                }

                return '.' + getDefaultTriggerClass();
            }

            /**
             * Get default trigger class from the chart instance
             * @return string chart.options.classNames.[specificClassName]
             */
            function getDefaultTriggerClass() {
                return chart.options.classNames.chart;
            }

            /**
             * Get horizontal point values (only useful for the line type chart)
             * @return Array pointValues The point values
             */
            function getPointValues() {
                var pointValues = [];

                if (!(chart instanceof Chartist.Line)) {
                    return;
                }

                chart.on('draw', function(data) {
                    if (data.type == 'line') {
                        chartRect = data.chartRect;
                        axisY = data.axisY;

                        pointValues.push(
                            data.values.map( function(point) {
                                var xoffset  = data.chartRect.x1;
                                var yoffset  = data.chartRect.y1;
                                return {
                                    x: point.x,
                                    y: point.y,
                                    pixelX: xoffset + data.axisX.projectValue(point.x),
                                    pixelY: yoffset - data.axisY.projectValue(point.y),
                                }
                            })
                        );
                    }

                    if (data.type == 'grid') {
                        pointValues.length = 0;
                    }
                });

                return pointValues;
            }

        }
    };

    /**
     * Get the closest number from an array
     * @param Int/Float number
     * @param Array array
     * @return Int The value from the array that is closest to the number
     */
    function getClosestPointFromArray(number, array) {
        if (array.length ===0) {
            return null;
        }

        return array.reduce(function (previous, current) {
            return (Math.abs(current.pixelX - number) < Math.abs(previous.pixelX - number) ? current : previous);
        }, {x:-Infinity, pixelX: -Infinity, y: Infinity, pixelY: Infinity});
    }
}(window, document, Chartist));
