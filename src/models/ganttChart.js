


nv.models.ganttChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , x = d3.scale.ordinal()
    , y = d3.scale.linear()
    ;

  var margin = {top: 30, right: 10, bottom: 10, left: 10}
    , width = 960
    , height = 500
    , color = nv.utils.getColor(d3.scale.category20c().range())
    , dispatch = d3.dispatch('stateChange', 'changeState')
    , tickPadding = 7
    , showYAxis = true
    , showXAxis = true
    ;

    xAxis
    .orient('left')
    .tickPadding(tickPadding)
    .highlightZero(false)
    .showMaxMin(false)
    ;
  yAxis
    .orient('bottom')
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------


  //============================================================


  function chart(selection) {
    selection.each(function(data) {

      var multibar = nv.models.multiBarHorizontal()
        , x
        , y
        , transitionDuration = 250
        ;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right
        , availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom
        , container = d3.select(this)
      ;

      chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
      chart.container = this;


      //------------------------------------------------------------
      // Setup Scales

      x = multibar.xScale();
      y = multibar.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-ganttChart').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-ganttChart');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      gEnter.append("rect").style('opacity', 0);
      gEnter.append('g').attr('class', 'nv-mainWrap');
      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      g.select("rect").attr('width', availableWidth).attr('height', availableHeight);

      //------------------------------------------------------------
      // Setup main components

      multibar
        .disabled(data.map(function(series) { return series.disabled }))
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map(function(d,i) {
          return d.color || color(d, i);
        }).filter(function(d,i) { return !data[i].disabled }))

      var barsWrap = g.select('.nv-barsWrap')
        .datum(data.filter(function(d) { return !d.disabled }))

      barsWrap.transition().call(multibar);

      //------------------------------------------------------------
      // Setup axes

      if (showXAxis) {
        xAxis
          .scale(d3.scale.linear())
          .ticks( availableHeight / 24 )
          .tickSize(-availableWidth, 0);

        g.select('.nv-x.nv-axis').transition()
            .call(xAxis);

        var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

        xTicks
            .selectAll('line, text')
            .style('opacity', 1)
      }

      if (showYAxis) {
        yAxis
          .scale(y)
          .ticks( availableWidth / 100 )
          .tickSize( -availableHeight, 0);

        g.select('.nv-y.nv-axis')
            .attr('transform', 'translate(0,' + availableHeight + ')');
        g.select('.nv-y.nv-axis').transition()
            .call(yAxis);
      }


      //------------------------------------------------------------
      // Handle events

      dispatch.on('changeState', function(e) {

        if (typeof e.disabled !== 'undefined') {
          data.forEach(function(series,i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        selection.call(chart);
      });


    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------


  chart.dispatch = dispatch;

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
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

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_)
    return chart;
  };

  //============================================================


  return chart;
}


