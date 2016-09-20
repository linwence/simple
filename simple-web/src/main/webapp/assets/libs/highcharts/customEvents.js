/**
 * Custom events v1.1.3 (2015-07-28)
 *
 * (c) 2012-2015 Black Label
 *
 * License: Creative Commons Attribution (CC)
 */

(function (HC) {
    /*jshint expr:true, boss:true */
    var UNDEFINED,
        seriesAnimate = HC.Series.prototype.animate,
        columnAnimate = HC.seriesTypes.column.prototype.animate,
        barAnimate = HC.seriesTypes.bar.prototype.animate,
        pieAnimate = HC.seriesTypes.pie.prototype.animate;

    //reanimate
    var reanimate = HC.Chart.prototype.reAnimate = function() {
        var chart = this;
        Highcharts.each(chart.series, function (s) {
            var animation = s.options.animation,
                clipBox = s.clipBox || chart.clipBox,
                sharedClipKey = ['_sharedClip', animation.duration, animation.easing, clipBox.height].join(','),
                clipRect = chart[sharedClipKey],
                markerClipRect = chart[sharedClipKey + 'm'];

            if (clipRect) {
                clipRect.attr({
                    width: 0
                });
            }
            if (markerClipRect) {
                markerClipRect.attr({
                    width: 0
                });
            }

            switch(s.type) {
                case 'pie':
                    s.animate = pieAnimate;
                    break;
                case 'column':
                    s.animate = columnAnimate;
                    break;
                case 'bar':
                    s.animate = barAnimate;
                    break;
                default:
                    s.animate = seriesAnimate;
                    break;
            }

            s.animate(true);
            s.isDirty = true;
        });

        chart.redraw();
    };

    //reseting all events, fired by Highcharts
    HC.Chart.prototype.callbacks.push(function (chart) {
        var resetAxisEvents = chart.customEvent.resetAxisEvents,
            forExport = chart.renderer.forExport,
            series = chart.series,
            serLen = series.length,
            xAxis = chart.xAxis,
            yAxis = chart.yAxis,
            i = 0;

        if(forExport) //skip custom events when chart is exported
            return false;

        resetAxisEvents(xAxis, 'xAxis', chart);
        resetAxisEvents(yAxis, 'yAxis', chart);

        for (; i < serLen; i++) {
            series[i].update({
                animation:{
                    enabled: true
                },
                customEvents: {
                    series: series[i].options.events,
                    point: series[i].options.point.events
                },
                events: {
                    click: null
                },
                point: {
                    events: {
                        click: null
                    }
                }
            }, false);
        }

        chart.xAxis[0].isDirty = true;
        reanimate.call(chart);
    });

    //custom event body
    var customEvent = HC.Chart.prototype.customEvent = function (obj, proto) {
        customEvent.add = function (elem, events, obj) {
            for (var key in events) {

                (function (key) {
                    if (events.hasOwnProperty(key) && elem) {
                        if (!elem[key] || elem[key] === UNDEFINED) {
                            HC.addEvent(elem.element, key, function (e) {
                                events[key].call(obj, e);
                                return false;
                            });
                        }

                        elem[key] = true;
                    }
                })(key)

            }
        };

        HC.Chart.prototype.customEvent.resetAxisEvents = function (axis, type, chart) {
            var axisLength = axis.length,
                userOptions = chart.userOptions,
                i = 0,
                j = 0,
                redraw = false,
                customEvents, plotBandsLength, plotLinesLength, plotLines, plotBands, cAxis;

            for (; i < axisLength; i++) {

                if (type === 'xAxis' && userOptions.xAxis !== UNDEFINED) {

                    cAxis = HC.splat(userOptions.xAxis);
                    plotLines = cAxis[i].plotLines;
                    plotBands = cAxis[i].plotBands;

                } else if (type === 'yAxis' && userOptions.yAxis !== UNDEFINED) {

                    cAxis = HC.splat(userOptions.yAxis);
                    plotLines = cAxis[i].plotLines;
                    plotBands = cAxis[i].plotBands;
                }

                if (plotLines !== UNDEFINED) {
                    plotLinesLength = plotLines.length;

                    for (j = 0; j < plotLinesLength; j++) {
                        var t = plotLines[j].events;
                        if (t) {
                            plotLines[j].customEvents = t;
                            plotLines[j].events = null;
                        }
                    };

                    redraw = true;
                }

                if (plotBands !== UNDEFINED) {
                    plotBandsLength = plotBands.length;

                    for (j = 0; j < plotBandsLength; j++) {
                        var t = plotBands[j].events;
                        if (t) {
                            plotBands[j].customEvents = t;
                            plotBands[j].events = null;
                        }
                    };

                    redraw = true;
                }

                if (redraw) {
                    chart.yAxis[i].update({
                        plotLines: plotLines,
                        plotBands: plotBands
                    }, false);
                }
            };
        };


        HC.wrap(obj, proto, function (proceed) {
            var events,
                element,
                eventsPoint,
                elementPoint,
                op;

            //call default actions
            var ob = proceed.apply(this, Array.prototype.slice.call(arguments, 1));

            //switch on object
            switch (proto) {
                case 'addLabel':
                    events = this.axis.options.labels.events;
                    element = this.label;
                    break;
                case 'setTitle':
                    events = this.options.title.events;
                    element = this.title;
                    break;
                case 'drawDataLabels':
                    events = this.dataLabelsGroup ? this.options.dataLabels.events : null;
                    element = this.dataLabelsGroup ? this.dataLabelsGroup : null;
                    break;
                case 'render':
                    if (this.axisTitle) {
                        events = this.options.title.events;
                        element = this.axisTitle;
                    }
                    if (this.options.value || this.options.from) {
                        events = this.options.customEvents;
                        element = this.svgElem;
                    }
                    break;
                case 'drawPoints':
                    op = this.options;
                    events = op.customEvents ? op.customEvents.series : op,
                        element = this.group;
                    eventsPoint = op.customEvents ? op.customEvents.point : op.point.events;
                    elementPoint = this.points;
                    break;
                case 'renderItem':
                    events = this.options.itemEvents;
                    element = this.group;
                    break;
            }


            if (events || eventsPoint) {

                if (eventsPoint) {
                    var len = elementPoint.length
                    j = 0;

                    for (; j < len; j++) {
                        var elemPoint = elementPoint[j].graphic;

                        if (elementPoint[j].y && elemPoint && elemPoint !== UNDEFINED) {
                            customEvent.add(elemPoint, eventsPoint, elementPoint[j]);
                        }
                    }
                }

                customEvent.add(element, events, this);
            }

            return ob;
        });
    };
    //labels
    customEvent(HC.Tick.prototype, 'addLabel');

    //axis / title
    customEvent(HC.Axis.prototype, 'render');

    //series events & point events
    customEvent(HC.Series.prototype, 'drawPoints');

    //datalabels events
    customEvent(HC.Series.prototype, 'drawDataLabels');

    //title events
    customEvent(HC.Chart.prototype, 'setTitle');

    //legend items
    customEvent(HC.Legend.prototype, 'renderItem');

    //plotbands + plotlines
    if (HC.PlotLineOrBand) {
        customEvent(HC.PlotLineOrBand.prototype, 'render');
    }

    //bubble charts
    if (HC.seriesTypes.bubble) {
        customEvent(HC.seriesTypes.bubble.prototype, 'drawPoints');
        customEvent(HC.seriesTypes.bubble.prototype, 'drawDataLabels');
    }

    //column chart
    if (HC.seriesTypes.column) {
        customEvent(HC.seriesTypes.column.prototype, 'drawDataLabels');
        customEvent(HC.seriesTypes.column.prototype, 'drawPoints');
    }

    if (HC.seriesTypes.pie) {
        customEvent(HC.seriesTypes.pie.prototype, 'drawDataLabels');
        customEvent(HC.seriesTypes.pie.prototype, 'drawPoints');
    }

})(Highcharts);