function startScanRealTimeChart(){
    globals.n = 150;
    var data = d3.range(globals.n).map(next);
    function next () {
        return {
            time: globals.t,
           value: globals.v
        };
    }	
	 
    var margin = {top: 10, right: 10, bottom: 20, left: 40},
        width = 450 - margin.left - margin.right,
        height = 420 - margin.top - margin.bottom;
	 
    var x = d3.scale.linear()
        .domain([0, globals.n - 1])
        .range([0, width]);
	 
    var y = d3.scale.linear()
        .domain([-2, 2])
        .range([height, 0]);

    var line = d3.svg.line().interpolate('basis')
        .x(function(d, i) {  return x(d.time); })
        .y(function(d, i) { return y(d.value); });
    $$("#cop1_div").empty();	 
    var svg = d3.select("#cop1_div").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
    var graph = g.append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom);	
	 
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var axis = graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var yAxis = d3.svg.axis().scale(y).orient("left");
    g.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    var path = graph.append("g")
		.append("path")
		.data([data])
		.attr("class", "line")
		.attr("d", line);
    tick();
		 
    function tick() 
	{ 
       if(globals.stopChart == false){
           
        // push a new data point onto the back
        data.push(next());

        // update domain
        x.domain([globals.t - globals.n, globals.t]);
        var oldY = y.domain();
	y.domain([Math.min(oldY[0], -2 + globals.v), Math.max(oldY[1], 2 + globals.v)]);
        // redraw path, shift path left
        path
            .attr("d", line)
            .attr("transform", null)
           // .interrupt()
            .transition()
            .duration(50)
            .ease("basis")
          //  .attr("transform", "translate(" + (t - 1) + ")")
            .each("end", tick);
        // shift axis left
        axis
         //   .interrupt()
            .transition()
            .duration(50)
            .ease("basis")
            .call(d3.svg.axis().scale(x).orient("bottom"));
	 
         svg.select(".y.axis").call(yAxis);
        // pop the old data point off the front
        data.shift();	 
    }
        }
	
}
  