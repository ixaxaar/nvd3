nv.models.lineWithFocusChartMultiCoordinates = function() {
    "use strict";
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , lines1 = nv.models.line()
        , lines2 = nv.models.line()
        , lines21 = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , y1Axis = nv.models.axis()
        , x2Axis = nv.models.axis()
        , y2Axis = nv.models.axis()
        , y21Axis = nv.models.axis()
        , legend = nv.models.legend()
        , brush = d3.svg.brush()
        ;

    var margin = {top: 30, right: 30, bottom: 30, left: 60}
        , margin2 = {top: 0, right: 30, bottom: 20, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , height2 = 50
        , x
        , y
        , y1
        , x2
        , y2
        , y21
        , showLegend = true
        , brushExtent = null
        , tooltips = true
        , tooltip = function(key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' +  y + ' at ' + x + '</p>'
        }
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush')
        , transitionDuration = 250
        , brushHandler = null
        , initialData = null
        , tooltipXTick = xAxis.tickFormat()
        , tooltipYTick = yAxis.tickFormat()
        ;

    lines
        .clipEdge(true)
    ;
    lines1
        .clipEdge(true)
    ;
    lines2
        .interactive(false)
    ;
    lines21
        .interactive(false)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(5)
    ;
    yAxis
        .orient('left')
    ;
    y1Axis
        .orient('right')
    ;
    x2Axis
        .orient('bottom')
        .tickPadding(5)
    ;
    y2Axis
        .orient('left')
    ;
    y21Axis
        .orient('right')
    ;
    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function(e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = tooltipXTick(lines.x()(e.point, e.pointIndex)),
            y = tooltipYTick(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };

    //============================================================


    function chart(selection) {
        selection.each(function(data) {
            var container = d3.select(this),
                that = this;

            if (!initialData) initialData = data;

            var availableWidth = (width  || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - height2,
                availableHeight2 = height2 - margin2.top - margin2.bottom;

            chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
            chart.container = this;


            //------------------------------------------------------------
            // Display No Data message if there's nothing to show.

            if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight1 / 2)
                    .text(function(d) { return d });

                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup Scales

            x = lines.xScale();
            y = lines.yScale();
            y1 = lines1.yScale();
            x2 = lines2.xScale();
            y2 = lines2.yScale();
            y21 = lines21.yScale();

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup containers and skeleton of chart

            var wrap = container.selectAll('g.nv-wrap.nv-lineWithFocusChartMultiCoordinates').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineWithFocusChartMultiCoordinates').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-legendWrap');

            var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
            focusEnter.append('g').attr('class', 'nv-x nv-axis');
            focusEnter.append('g').attr('class', 'nv-y nv-axis');
            focusEnter.append('g').attr('class', 'nv-y1 nv-axis');
            focusEnter.append('g').attr('class', 'nv-linesWrap');
            focusEnter.append('g').attr('class', 'nv-linesWrap1');

            var contextEnter = gEnter.append('g').attr('class', 'nv-context');
            contextEnter.append('g').attr('class', 'nv-x nv-axis');
            contextEnter.append('g').attr('class', 'nv-y nv-axis');
            contextEnter.append('g').attr('class', 'nv-y21 nv-axis');
            contextEnter.append('g').attr('class', 'nv-linesWrap');
            contextEnter.append('g').attr('class', 'nv-linesWrap21');
            contextEnter.append('g').attr('class', 'nv-brushBackground');
            contextEnter.append('g').attr('class', 'nv-x nv-brush');

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Legend

            if (showLegend) {
                legend.width(availableWidth);

                legend.rectangularCheckboxes(true);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if ( margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight1 = (height || parseInt(container.style('height')) || 400)
                        - margin.top - margin.bottom - height2;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) +')')
            }

            //------------------------------------------------------------


            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


            //------------------------------------------------------------
            // Main Chart Component(s)
            lines
                .width(availableWidth)
                .height(availableHeight1)
                .color(
                    data
                        .map(function(d,i) {
                            return d.color || color(d, i);
                        })
                        .filter(function(d,i) {
                            return !data[i].disabled && !data[i].axisRight;
                        })
                );

            lines1
                .defined(lines.defined())
                .width(availableWidth)
                .height(availableHeight1)
                .color(
                    data
                        .map(function(d,i) {
                            return d.color || color(d, i);
                        })
                        .filter(function(d,i) {
                            return (!data[i].disabled && data[i].axisRight);
                        })
                );

            lines2
                .defined(lines.defined())
                .width(availableWidth)
                .height(availableHeight2)
                .color(
                    data
                        .map(function(d,i) {
                            return d.color || color(d, i);
                        })
                        .filter(function(d,i) {
                            return !data[i].disabled && !data[i].axisRight;
                        })
                );

            lines21
                .defined(lines2.defined())
                .width(availableWidth)
                .height(availableHeight2)
                .color(
                    data
                        .map(function(d,i) {
                            return d.color || color(d, i);
                        })
                        .filter(function(d,i) {
                            return !data[i].disabled && data[i].axisRight;
                        })
                );

            g.select('.nv-context')
                .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')

            var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
                .datum(initialData.filter(function(d) { return !d.disabled && !d.axisRight }))
            ;

            d3.transition(contextLinesWrap).call(lines2);

            var contextLinesWrap21 = g.select('.nv-context .nv-linesWrap21')
                .datum(initialData.filter(function(d) { return !d.disabled && d.axisRight }))
            ;

            d3.transition(contextLinesWrap21).call(lines21);


            //------------------------------------------------------------

//             var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
//                .datum(data.filter(function(d) { return (!d.disabled && !d.axisRight) }))
//             ;
//             d3.transition(focusLinesWrap).call(lines);


            //------------------------------------------------------------
            // Setup Main (Focus) Axes

            xAxis
                .scale(x)
                .ticks( availableWidth / 100 )
                .tickSize(-availableHeight1, 0);

            yAxis
                .scale(y)
                .ticks( availableHeight1 / 36 )
                .tickSize( -availableWidth, 0);

            y1Axis
                .scale(y1)
                .ticks( availableHeight1 / 36 )
                .tickSize( 0, 0);

            g.select('.nv-focus .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + availableHeight1 + ')');

            g.select('.nv-y1.nv-axis')
                .attr('transform', 'translate(' + availableWidth + ',0)');

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup Brush

            brush
                .x(x2)
                .on('brush', function() {
                    //When brushing, turn off transitions because chart needs to change immediately.
                    var oldTransition = chart.transitionDuration();
                    chart.transitionDuration(0);
                    onBrush();
                    chart.transitionDuration(oldTransition);
                });

            if (brushExtent) brush.extent(brushExtent);

            var brushBG = g.select('.nv-brushBackground').selectAll('g')
                .data([brushExtent || brush.extent()])

            var brushBGenter = brushBG.enter()
                .append('g');

            brushBGenter.append('rect')
                .attr('class', 'left')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            brushBGenter.append('rect')
                .attr('class', 'right')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            var gBrush = g.select('.nv-x.nv-brush')
                .call(brush);
            gBrush.selectAll('rect')
                //.attr('y', -5)
                .attr('height', availableHeight2);
            gBrush.selectAll('.resize').append('path').attr('d', resizePath);

            onBrush();

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Setup Secondary (Context) Axes

            x2Axis
                .scale(x2)
                .ticks( availableWidth / 100 )
                .tickSize(-availableHeight2, 0);

            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');
            d3.transition(g.select('.nv-context .nv-x.nv-axis'))
                .call(x2Axis);


            y2Axis
                .scale(y2)
                .ticks( availableHeight2 / 36 )
                .tickSize( -availableWidth, 0);

            y21Axis
                .scale(y21)
                .ticks( availableHeight2 / 36 )
                .tickSize(0, 0);

            d3.transition(g.select('.nv-context .nv-y.nv-axis'))
                .call(y2Axis);

            if(contextLinesWrap21.datum().length > 0)
                d3.transition(g.select('.nv-context .nv-y21.nv-axis'))
                    .attr("opacity", 1)
                    .call(y21Axis);
            else
                d3.transition(g.select('.nv-context .nv-y21.nv-axis'))
                    .attr("opacity", 0);

            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');

            g.select('.nv-y21.nv-axis')
                .attr('transform', 'translate(' + availableWidth + ',0)');

            //------------------------------------------------------------


            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function(newState) {
                // todo: bug: do not update if only 1 element is left on the x axis!
                var d = data.filter(function(d,i){return !d.disabled && !d.axisRight});
                if (d.length > 0) chart.update();
            });

            dispatch.on('tooltipShow', function(e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            //============================================================


            //============================================================
            // Functions
            //------------------------------------------------------------

            // Taken from crossfilter (http://square.github.com/crossfilter/)
            function resizePath(d) {
                var e = +(d == 'e'),
                    x = e ? 1 : -1,
                    y = availableHeight2 / 3;
                return 'M' + (.5 * x) + ',' + y
                    + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                    + 'V' + (2 * y - 6)
                    + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                    + 'Z'
                    + 'M' + (2.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8)
                    + 'M' + (4.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8);
            }


            function updateBrushBG() {
                if (!brush.empty()) brush.extent(brushExtent);
                brushBG
                    .data([brush.empty() ? x2.domain() : brushExtent])
                    .each(function(d,i) {
                        var leftWidth = x2(d[0]) - x.range()[0],
                            rightWidth = x.range()[1] - x2(d[1]);
                        d3.select(this).select('.left')
                            .attr('width',  leftWidth < 0 ? 0 : leftWidth);

                        d3.select(this).select('.right')
                            .attr('x', x2(d[1]))
                            .attr('width', rightWidth < 0 ? 0 : rightWidth);
                    });
            }


            function onBrush() {
                brushExtent = brush.empty() ? null : brush.extent();
                var extent = brush.empty() ? x2.domain() : brush.extent();

                //The brush extent cannot be less than one.  If it is, don't update the line chart.
                if (Math.abs(extent[0] - extent[1]) <= 1) {
                    return;
                }

                dispatch.brush({extent: extent, brush: brush});


                updateBrushBG();

                // Update Main (Focus)
                var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                    .datum(
                        data
                            .filter(function(d) { return !d.disabled && !d.axisRight })
                            .map(function(d,i) {
                                return {
                                    key: d.key,
                                    axisRight: d.axisRight,
                                    values: d.values.filter(function(d,i) {
                                        return lines.x()(d,i) >= extent[0] && lines.x()(d,i) <= extent[1];
                                    })
                                }
                            })
                    );
                focusLinesWrap.transition().duration(transitionDuration).call(lines);

                var focusLinesWrap1 = g.select('.nv-focus .nv-linesWrap1')
                    .datum(
                        data
                            .filter(function(d) { return !d.disabled && d.axisRight })
                            .map(function(d,i) {
                                return {
                                    key: d.key,
                                    axisRight: d.axisRight,
                                    values: d.values.filter(function(d,i) {
                                        return lines1.x()(d,i) >= extent[0] && lines1.x()(d,i) <= extent[1];
                                    })
                                }
                            })
                    );
                // draw this if only there is data
                focusLinesWrap1.transition().duration(transitionDuration)
                        .call(lines1);


                // Update Main (Focus) Axes
                g.select('.nv-focus .nv-x.nv-axis').transition().duration(transitionDuration)
                    .call(xAxis);
                g.select('.nv-focus .nv-y.nv-axis').transition().duration(transitionDuration)
                    .call(yAxis);

                // draw this if only there is data
                if (focusLinesWrap1.datum().length > 0)
                    g.select('.nv-focus .nv-y1.nv-axis').transition().duration(transitionDuration)
                        .attr("opacity", 1)
                        .call(y1Axis);
                else
                    g.select('.nv-focus .nv-y1.nv-axis').attr("opacity", 0);
            }

            //============================================================


        });

        return chart;
    }


    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function(e) {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function(e) {
        dispatch.tooltipHide(e);
    });

    lines1.dispatch.on('elementMouseover.tooltip', function(e) {
        e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines1.dispatch.on('elementMouseout.tooltip', function(e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function() {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.legend = legend;
    chart.lines = lines;
    chart.lines2 = lines2;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.y1Axis = y1Axis;
    chart.x2Axis = x2Axis;
    chart.y2Axis = y2Axis;
    chart.y21Axis = y21Axis;
    chart.brush = brush;

    d3.rebind(chart, lines, 'defined', 'isArea', 'size', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id');

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart.x = function(_) {
        if (!arguments.length) return lines.x;
        lines.x(_);
        lines1.x(_);
        lines2.x(_);
        return chart;
    };

    chart.y = function(_) {
        if (!arguments.length) return lines.y;
        lines.y(_);
        lines1.x(_);
        lines2.y(_);
        return chart;
    };

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
        margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
        return chart;
    };

    chart.margin2 = function(_) {
        if (!arguments.length) return margin2;
        margin2 = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.height2 = function(_) {
        if (!arguments.length) return height2;
        height2 = _;
        return chart;
    };

    chart.color = function(_) {
        if (!arguments.length) return color;
        color =nv.utils.getColor(_);
        legend.color(color);
        return chart;
    };

    chart.showLegend = function(_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

    chart.tooltips = function(_) {
        if (!arguments.length) return tooltips;
        tooltips = _;
        return chart;
    };

    chart.tooltipContent = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _;
        return chart;
    };

    chart.interpolate = function(_) {
        if (!arguments.length) return lines.interpolate();
        lines.interpolate(_);
        lines1.interpolate(_);
        lines2.interpolate(_);
        return chart;
    };

    chart.noData = function(_) {
        if (!arguments.length) return noData;
        noData = _;
        return chart;
    };

    // Chart has multiple similar Axes, to prevent code duplication, probably need to link all axis functions manually like below
    chart.xTickFormat = function(_) {
        if (!arguments.length) return xAxis.tickFormat();
        xAxis.tickFormat(_);
        x2Axis.tickFormat(_);
        return chart;
    };

    chart.yTickFormat = function(_) {
        if (!arguments.length) return yAxis.tickFormat();
        yAxis.tickFormat(_);
        y1Axis.tickFormat(_);
        y2Axis.tickFormat(_);
        y21Axis.tickFormat(_);
        return chart;
    };

    chart.tooltipXTickFormat = function(_) {
        if (!arguments.length) return tooltipXTick;
        tooltipXTick = _;
    };

    chart.tooltipYTickFormat = function(_) {
        if (!arguments.length) return tooltipYTick;
        tooltipYTick = _;
    };

    chart.brushExtent = function(_) {
        if (!arguments.length) return brushExtent;
        brushExtent = _;
        return chart;
    };

    chart.transitionDuration = function(_) {
        if (!arguments.length) return transitionDuration;
        transitionDuration = _;
        return chart;
    };

    chart.brushHandler = function(_) {
        if (!arguments.length) return brushHandler;
        brushHandler = _;

        chart.brush.on('brushend', function(e) {
            if (chart.brushExtent() instanceof Array) {
                brushHandler(chart.brushExtent());
            }
        });
        return chart;
    };

    //============================================================


    return chart;
};


