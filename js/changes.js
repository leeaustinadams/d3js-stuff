changes = function() {
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var infoLine = d3.select("body").append("div")
        .attr("class", "info")
        .style("opacity", 0);

    function cleanupChangesData(d) {
        d.createdDate = new Date(d.created + " UTC");
        d.createdTime = new Date().setHours(d.createdDate.getHours(),
                                               d.createdDate.getMinutes(),
                                               d.createdDate.getSeconds());
        d.updatedDate = new Date(d.updated + " UTC");
        d.updatedTime = new Date().setHours(d.updatedDate.getHours(),
                                               d.updatedDate.getMinutes(),
                                               d.updatedDate.getSeconds());
        d.plotDate = d.updatedDate;
        d.plotTime = d.updatedTime;
        return d;
    }

    function renderChart(data) {
        var margin = {top: 40, right: 40, bottom: 40, left: 40},
            width = 1200 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom,
            barHeight = height / data.length;

        var svg = d3.select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([0, height]);

        x.domain([d3.min(data, function(d) { return d.createdDate; }), d3.max(data, function(d) { return d.createdDate; })]);
        y.domain([data.length, 0]);

        var xAxis = d3.axisBottom(x);

        var xExtent = d3.extent(data, function(d) { return d.createdDate; });

        var zoom = d3.zoom()
            .scaleExtent([0.75, 64])
            .on("zoom", zoomed);

        var rects = svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return x(d.createdDate);
            })
            .attr("y", function(d, i) {
                return y(i);
            })
            .attr("height", function (d) {
                return barHeight;
            })
            .attr("width", function(d) {
                return x(d.updatedDate) - x(d.createdDate);
            })
            .attr("class", function(d) { return "rect " + d.status; });

        svg.call(zoom);
        rects.on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip	.html(d.subject + " " + d.createdDate.toLocaleDateString() + " - " + d.updatedDate.toLocaleDateString())
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            infoLine.transition()
                .duration(200)
                .style("opacity", 1);
            infoLine.html(d.createdDate);
        }).on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            infoLine.transition()
                .duration(500)
                .style("opacity", 0);
        });

        var axisGroup = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height + margin.top) + ")")
            .call(xAxis);

        function zoomed() {
            var xz = d3.event.transform.rescaleX(x),
                yz = d3.event.transform.rescaleY(y);

            axisGroup.call(xAxis.scale(xz));

            rects.attr("transform", d3.event.transform);
        }
    }

    return {
        render: function() {
            d3.json("data/changes_clean.json", function(error, data) {
                if (!error) {
                    renderChart(_.map(data, cleanupChangesData));
                }
            });
        }
    };
};
