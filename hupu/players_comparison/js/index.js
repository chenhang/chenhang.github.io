var graph;
var dataSet;

d3.select('#shot-freq').on('click', function () {draw('shot_freq');});
d3.select('#play-freq').on('click', function () {draw('play_freq');});
d3.select('#defender-range-out')
    .on('click', function () {
        draw('defender_range_out');
    });

d3.select('#defender-range')
    .on('click', function () {
        draw('defender_range');
    });

d3.select('#touch-time-range')
    .on('click', function () {
        draw('touch_time_range');
    });

d3.select('#dribbles-range')
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
d3.select('#passing')
    .on('click', function () {
        draw('passing');
    });

d3.select('#transition').on('click', function () {draw('transition');});
d3.select('#isolation').on('click', function () {draw('isolation');});
d3.select('#pr-ball-handler').on('click', function () {draw('pr_ball_handler');});
d3.select('#pr-rollman').on('click', function () {draw('pr_rollman');});
d3.select('#postup').on('click', function () {draw('postup');});
d3.select('#spotup').on('click', function () {draw('spotup');});
d3.select('#handoff').on('click', function () {draw('handoff');});
d3.select('#cut').on('click', function () {draw('cut');});
d3.select('#off-screen').on('click', function () {draw('off_screen');});
d3.select('#off-rebound').on('click', function () {draw('off_rebound');});

d3.select('#rim-defense').on('click', function () {draw('rim_defense');});
function draw(fileName) {
    d3.csv('data/' + fileName + '.csv', function (data) {
        d3.select('#wrapper').selectAll("*").remove();
        d3.select('#grid').selectAll("*").remove();
        dataSet = data;
        var cellWidthPct = 100.0/(Object.keys(dataSet[0]).length) + '%';

        graph = d3.parcoords()('#wrapper')
            .data(data)
            .alpha(0.4)
            .mode("queue")
            .rate(5)
            .render()
            .interactive()
            .brushable()


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
            d3.selectAll('.cell').style('width', cellWidthPct);
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
        graph.on("render", function () {
            d3.selectAll('.cell').style('width', cellWidthPct);
        })
        d3.selectAll('.cell').style('width', cellWidthPct);

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