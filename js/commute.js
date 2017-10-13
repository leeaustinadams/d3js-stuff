commute = function() {
    var dateFormat = d3.timeFormat("%m/%d/%Y");
    var timeFormat = d3.timeFormat("%I:%M %p");
    var parseDate = d3.timeParse("%m/%d/%Y");
    var parseTime = d3.timeParse("%I:%M %p");

    function type(d) {
        d.balance = +d.balance; // coerce to number
        d.amount = +d.amount;
        d.time = parseTime(d.time);
        d.date = parseDate(d.date);
        return d;
    }

    function makeItem(label, a, b) {
        return { date: a.date,
                 durationMinutes: (b.time - a.time) / (1000 * 60),
                 start: a.time,
                 end: b.time,
                 label: label,
                 info: timeFormat(a.time) + " to " + timeFormat(b.time) + " on " + dateFormat(a.date) };
    }

    function cleanupData(data) {
        var newData = [], a, b;
        for(var i = 0; i < data.length; i++) {
            a = data[i];
            b = (i < (data.length - 1)) ? data[i + 1] : null;

            if (a && a.route.indexOf("24") >= 0) {
                if (b) {
                    if (b.route.indexOf("24") >= 0) {
                        // Segment of bus headed south
                        newData.push(makeItem(a.route, a, b));
                    } else if (b.location.indexOf("Muni") >= 0) {
                        // Segment of walkign to Muni
                        newData.push(makeItem(b.location, a, b));
                    }
                }
            } else if (a.route.indexOf("SF-L") >= 0) {
                // Segment of ferry headed to Larkspur
                if (b && b.route.indexOf("25W") >= 0) {
                    newData.push(makeItem(a.route, a, b));
                }
            } else if (a.route.indexOf("25W") >= 0) {
                // Segment of bus from ferry to stop
                if (b && b.route.indexOf("25W") >= 0) {
                    newData.push(makeItem(a.route, a, b));
                }
            } else if (data[i].location.indexOf("Civic Center") >= 0) {
                // Segment of muni from Civic center to ferry
                if (b && b.route.indexOf("SF-L") >= 0) {
                    newData.push(makeItem(a.location, a, b));
                }
            }
        }

        return newData;
    }

    // Define the div for the tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var infoLine = d3.select("body").append("div")
        .attr("class", "info")
        .style("opacity", 0);

    function renderChart(offsetX, offsetY, data) {
        var barWidth = 16,
            margin = {top: 40, right: 40, bottom: 40, left: 40},
            width = data.length * (4 + barWidth),
            height = 480 - margin.top - margin.bottom;

        var x = d3.scaleTime()
            .range([offsetX, width])
            .domain([data[0].date, data[data.length - 1].date]);
        var y = d3.scaleTime()
            .range([height + offsetY, 0])
            .domain([d3.max(data, function (d) { return d.end; }), d3.min(data, function(d) { return d.start; })]);

        var svg = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                  "translate(" + margin.left + ", " + margin.top + ")");

        // Define the axes
        var xAxis = d3.axisBottom(x);
        var yAxis = d3.axisLeft(y);

        var bar = svg.selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d, i) { return "translate(" + x(d.date) + ", 0)"; });

        bar.append("rect")
            .attr("y", function(d) {
                return y(d.start);
            })
            .attr("height", function (d) {
                return y(d.end) - y(d.start);
            })
            .attr("width", barWidth - 2);

        bar.append("text")
            .attr("x", barWidth * 0.75)
            .attr("y", function(d) { return y(d.start) + 4; })
            .attr("dy", ".75em")
            .text(function(d) { return d.durationMinutes; });

        bar.on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip	.html(d.label)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            infoLine.transition()
                .duration(200)
                .style("opacity", 1);
            infoLine.html(d.info);
        }).on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            infoLine.transition()
                .duration(500)
                .style("opacity", 0);
        });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + offsetX + ", 0)")
            .call(yAxis);
    }

    return {
        render: function() {
            d3.tsv("data/commute.tsv", type, function(error, data) {
                if (error) throw error;
                var data = cleanupData(data);
                renderChart(0, 0, data);
            });
        }
    };
};
