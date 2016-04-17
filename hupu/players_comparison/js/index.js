var graph;
var dataSet;

d3.select('#shoot-frequency')
    .on('click', function () {
        d3.selectAll('.category').classed( "hover", false );
        d3.select('#shoot-frequency').classed( "hover", true );
        draw('freq');
    });
d3.select('#defender-range-out')
    .on('click', function () {
        draw('defender_range_out');
    });

d3.select('#defender-range')
    .on('click', function () {
        draw('defender_range');
    });

d3.select('#touch-range')
    .on('click', function () {
        draw('touch_time_range');
    });

d3.select('#dribble-range')
    .on('click', function () {

        draw('dribbles_range');
    });

d3.select('#base-per-36')
    .on('click', function () {
        draw('base_per_36');
    });

d3.select('#base-defense')
    .on('click', function () {
        draw('base_defense');
    });

d3.select('#speed-distance')
    .on('click', function () {
        draw('speed_distance');
    });
function draw(fileName) {
    d3.csv('data/' + fileName + '.csv', function (data) {
        d3.select('#wrapper').selectAll("*").remove();
        d3.select('#grid').selectAll("*").remove();
        dataSet = data;
        graph = d3.parcoords()('#wrapper')
            .data(data)
            .alpha(0.4)
            .mode("queue")
            .rate(5)
            .render()
            .interactive()
            .brushable();


        graph.svg
            .selectAll(".dimension")
            .on("click", change_color);


        var grid = d3.divgrid();
        d3.select("#grid")
            .datum(data.slice(0, 400))
            .call(grid)
            .selectAll(".row")
            .on({
                "click": function (d) {
                    graph.highlight([d])
                }
            });

        graph.on("brush", function (d) {
            d3.select("#grid")
                .datum(d.slice(0, 400))
                .call(grid)
                .selectAll(".row")
                .on({
                    "click": function (d) {
                        graph.highlight([d])
                    },
                });
        });
    });

    d3.select("#keep-data")
        .on("click", function () {
            new_data = graph.brushed();
            if (new_data.length == 0) {
                alert("Please do not select all the data when keeping/excluding");
                return false;
            }
            callUpdate(new_data);
        });

    d3.select("#exclude-data")
        .on("click", function () {
            new_data = _.difference(dataSet, graph.brushed());
            if (new_data.length == 0) {
                alert("Please do not select all the data when keeping/excluding");
                return false;
            }
            callUpdate(new_data);
        });


    d3.select("#reset-data")
        .on("click", function () {
            callUpdate(dataSet);
        });
    d3.select("#reset-highlight")
        .on("click", function () {
            graph.unhighlight()
        });

    var color_scale = d3.scale.linear()
        .domain([-2, -0.5, 0.5, 2])
        .range(["#DE5E60", "steelblue", "steelblue", "#98df8a"])
        .interpolate(d3.interpolateLab);

    function change_color(dimension) {
        graph.svg.selectAll(".dimension")
            .style("font-weight", "normal")
            .filter(function (d) {
                return d == dimension;
            })
            .style("font-weight", "bold");

        graph.color(zcolor(graph.data(), dimension)).render()
    }

    function zcolor(col, dimension) {
        var z = zscore(_(col).pluck(dimension).map(parseFloat));
        return function (d) {
            var value = d[dimension] || 0;
            return color_scale(z(value))
        }
    };

    function zscore(col) {
        var _col = col.filter(function(e){ return e === 0 || e });
        var n = _col.length,
            mean = _(_col).mean(),
            sigma = _(_col).stdDeviation();

        return function (d) {
            return (d - mean) / sigma;
        };
    };

    function callUpdate(data) {
        graph.data(data).brush();
    }
}