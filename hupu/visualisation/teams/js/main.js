d3.json('data/summary.json', function(data) {

    var keys = data['headers'];
    var bounds = data['bounds'];
    var data = data['data'];
    var diffSize = true;
    var teams = _.keys(data);
    var xAxis = 'OFF_RATING', yAxis = 'DEF_RATING';
    var xReverse = false, yReverse = true;
    var team = teams[0];
    // descriptions for axis labels
    var descriptions = {
        "OFF_RATING": "OffRtg: Offensive Rating - The number of points scored per 100 possessions by a team. For a player, it is the number of points per 100 possessions that the team scores while that individual player is on the court.",
        "DEF_RATING": "DefRtg: Defensive Rating - The number of points allowed per 100 possessions by a team. For a player, it is the number of points per 100 possessions that the team allows while that individual player is on the court.",
        "NET_RATING": "NetRtg: Net Rating - Net Rating is the difference in a player or team's Offensive and Defensive Rating. The formula for this is: Offensive Rating - Defensive Rating.",
        "AST_PCT": "AST%: Assist Percentage - Assist Percentage is the percent of teammate's field goals that the player assisted.",
        "AST_TO": "AST/TO: Assist to Turnover Ratio - The number of assists a player has for every turnover that player commits.",
        "AST_RATIO": "AST Ratio: Assist Ratio - Assist Ratio is the number of assists a player or team averages per 100 of their own possessions.",
        "OREB_PCT": "OREB%: Offensive Rebound Percentage - The percentage of offensive rebounds a player or team obtains while on the court.",
        "DREB_PCT": "DREB%: Defensive Rebound Percentage - The percentage of defensive rebounds a player or team obtains while on the court.",
        "REB_PCT": "REB%: Rebound Percentage - The percentage of total rebounds a player obtains while on the court.",
        "TM_TOV_PCT": "TO Ratio: Turnover Ratio - Turnover Ratio is the number of turnovers a player or team averages per 100 of their own possessions.",
        "EFG_PCT": "eFG%: Effective Field Goal Percentage - Effective Field Goal Percentage is a field goal percentage that is adjusted for made 3 pointers being 1.5 times more valuable than a 2 point shot.",
        "TS_PCT": "TS%: True Shooting Percentage - A shooting percentage that is adjusted to include the value three pointers and free throws. The formula is: Points/ [2*(Field Goals Attempted+0.44*Free Throws Attempted)]",
        "USG_PCT": "USG%: Usage Percentage - The percentage of a team's offensive possessions that a player uses while on the court.",
        "PACE": "PACE: Pace - Pace is the number of possessions per 48 minutes for a player or team.",
        "PIE": "PIE: Player Impact Estimate - PIE is an estimate of a player's or team's contributions and impact on a game. PIE shows what % of game events did that player or team achieve.",
        "FGM": "FGM",
        "FGA": "FGA",
        "FGM_PG": "FGM_PG",
        "FGA_PG": "FGA_PG",
        "FG_PCT": "FG_PCT"
    };

    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", 2000)
        .attr("height", 1000);
    var xScale, yScale;

    svg.append('g')
        .classed('chart', true)
        .attr('transform', 'translate(80, -60)');

    d3.select('#team-menu')
        .selectAll('li')
        .data(teams)
        .enter()
        .append('li')
        .text(function(d) {return d;})
        .classed('selected', function(d) {
            return d === team;
        })
        .on('click', function(d) {
            if (team === d) {
                diffSize = !diffSize;
            }
            team = d;
            generateChart();
            updateMenus();
        });

    d3.select('#x-axis-menu')
        .selectAll('li')
        .data(keys)
        .enter()
        .append('li')
        .text(function(d) {return d;})
        .classed('selected', function(d) {
            return d === xAxis;
        })
        .on('click', function(d) {
            if (xAxis === d) {
                xReverse = !xReverse;
            }
            xAxis = d;
            generateChart();
            updateMenus();
        });

    d3.select('#y-axis-menu')
        .selectAll('li')
        .data(keys)
        .enter()
        .append('li')
        .text(function(d) {return d;})
        .classed('selected', function(d) {
            return d === yAxis;
        })
        .on('click', function(d) {
            if (yAxis === d) {
                yReverse = !yReverse;
            }
            yAxis = d;
            generateChart();
            updateMenus();
        });

    d3.select('svg g.chart')
        .append('text')
        .attr({'id': 'countryLabel', 'x': 0, 'y': 120})
        .style({'font-size': '20px', 'font-weight': 'bold', 'fill': '#ddd'});

    d3.select('svg g.chart')
        .append('text')
        .attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
        .text(xAxis);

    d3.select('svg g.chart')
        .append('text')
        .attr('transform', 'translate(-60, 330)rotate(-90)')
        .attr({'id': 'yLabel', 'text-anchor': 'middle'})
        .text(yAxis);

    updateScales();
    generateChart();

    updateChart();
    updateMenus();

    d3.select('svg g.chart')
        .append("g")
        .attr('transform', 'translate(0, 630)')
        .attr('id', 'xAxis')
        .call(makeXAxis);

    d3.select('svg g.chart')
        .append("g")
        .attr('id', 'yAxis')
        .attr('transform', 'translate(-10, 0)')
        .call(makeYAxis);


    function generateChart(init) {
        var pointColour = d3.scale.category20b();
        d3.select('svg g.chart')
            .selectAll('circle')
            .data(data[team])
            .enter()
            .append('circle')
            .attr('cx', function(d) {
                return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
            })
            .attr('cy', function(d) {
                return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
            })
            .attr('fill', function(d, i) {return 'steelBlue';})
            .style('cursor', 'pointer')
            .on('mouseover', function(d) {
                if (d['TEAM_ABBREVIATION'] === team) {
                    d3.select('svg g.chart #countryLabel')
                        .text(d.NAME)
                        .transition()
                        .style('opacity', 1);
                }
            })
            .on('mouseout', function(d) {
                d3.select('svg g.chart #countryLabel')
                    .transition()
                    .duration(1500)
                    .style('opacity', 0);
            });
        updateChart();
    }

    function updateChart() {
        updateScales();

        d3.select('svg g.chart')
            .selectAll('circle')
            .transition()
            .duration(500)
            .ease('quad-out')
            .attr('cx', function(d) {
                return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
            })
            .attr('cy', function(d) {
                return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
            })
            .attr('r', function(d) {
                return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : (diffSize ? 20 * (d.MIN/bounds['MIN'].max) : 12);
            })
            .style('opacity', function(d) {
                return d['TEAM_ABBREVIATION'] === team ? (diffSize ? (d.GP/bounds['GP'].max) : 1) : 0;
            });

        d3.select('#xAxis')
            .transition()
            .call(makeXAxis);

        d3.select('#yAxis')
            .transition()
            .call(makeYAxis);

        d3.select('#xLabel')
            .text(xAxis);

        d3.select('#yLabel')
            .text(yAxis);
    }

    function getDomain(key, reverse) {
        return reverse ? [bounds[key].min, bounds[key].max].reverse() : [bounds[key].min, bounds[key].max]
    }

    function updateScales() {
        xScale = d3.scale.linear()
            .domain(getDomain(xAxis, xReverse))
            .range([20, 780]);

        yScale = d3.scale.linear()
            .domain(getDomain(yAxis, yReverse))
            .range([600, 100]);
    }

    function makeXAxis(s) {
        s.call(d3.svg.axis()
            .scale(xScale)
            .orient("bottom"));
    }

    function makeYAxis(s) {
        s.call(d3.svg.axis()
            .scale(yScale)
            .orient("left"));
    }

    function updateMenus() {
        d3.select('#team-menu')
            .selectAll('li')
            .classed('selected', function(d) {
                return d === team;
            });
        d3.select('#x-axis-menu')
            .selectAll('li')
            .classed('selected', function(d) {
                return d === xAxis;
            });
        d3.select('#y-axis-menu')
            .selectAll('li')
            .classed('selected', function(d) {
                return d === yAxis;
            });
    }

})



