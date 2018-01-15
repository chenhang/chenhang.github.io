var maxValue = 1,
    teamColors = {
        "MIL": "00471B",
        "GS": "FDB927",
        "MIN": "005083",
        "MIA": "98002E",
        "ATL": "E13A3E",
        "BOS": "008348",
        "DET": "006BB6",
        "NY": "006BB6",
        "EST": "00559A",
        "WST": "EC003D",
        "DEN": "4D90CD",
        "DAL": "061922",
        "BKN": "061922",
        "POR": "061922",
        "OKC": "007DC3",
        "TOR": "CE1141",
        "CHI": "CE1141",
        "SA": "061922",
        "CHA": "1D1160",
        "UTAH": "002B5C",
        "CLE": "860038",
        "HOU": "CE1141",
        "WAS": "002B5C",
        "LAL": "FDB927",
        "PHI": "ED174C",
        "MEM": "7399C6",
        "LAC": "ED174C",
        "SAC": "724C9F",
        "ORL": "007DC5",
        "PHX": "E56020",
        "IND": "FFC633",
        "NO": "002B5C"
    };

function searchBy(event) {
    if (event.keyCode == 13) {
        var teamName = document.getElementById("teamSearch").value.toLowerCase();
        var table = document.getElementsByClassName("teamTable")[0];
        var tr = table.getElementsByClassName("team-row");
        // Loop through all table rows, and hide those who don't match the search query
        for (var i = 0; i < tr.length; i++) {
            var td = tr[i].getElementsByTagName("td");
            if (td) {
                var teamMatch = teamName && td[0].innerHTML.toLowerCase().indexOf(teamName) > -1,
                    noInput = !teamName && !teamName;
                if (noInput || teamMatch) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }
}

function drawTable() {
    var table = d3.select('.teamTable');
    var tHead = table.append('tr').attr('class', 'header');
    tHead.selectAll('th')
        .data(TABLE_HEADERS).enter()
        .append('th')
        .text(function (column) {
            return column;
        });
    var rows = table.selectAll('tr').filter('.team-row')
        .data(teamNames)
        .enter()
        .append('tr').attr('class', 'team-row').attr('id', function (d, i) {
            return 'team-' + String(i);
        })
        .on("mouseover", function (d, i) {
            d3.select('#team-' + String(i)).style('background-color', '#f1f1f1');
        })
        .on("mouseout", function (d, i) {
            if (selectedTeams.indexOf(i) < 0) {
                d3.select('#team-' + String(i)).style('background-color', '#fff');
            }
        })
        .on("click", function (d, i) {
            if (selectedTeams.indexOf(i) < 0) {
                d3.select('#team-' + String(i)).style('background-color', '#f1f1f1');
                selectedTeams.push(i);
            } else {
                d3.select('#team-' + String(i)).style('background-color', '#fff');
                delete selectedTeams[selectedTeams.indexOf(i)];
            }
            drawComparedTeam()
        });
    rows.selectAll('td')
        .data(function (row) {
            return TABLE_HEADERS.map(function (column, index) {
                return {
                    column: column,
                    value: row.name
                };
            });
        })
        .enter()
        .append('td')
        .text(function (d) {
            return d.value;
        });
}

function drawComparedTeam() {
    var size = 600,
        _top = 100,
        right = 100,
        bottom = 100,
        left = 100;
    var data = [],
        names = [],
        colors = [];
    var i = 0;
    selectedTeams.slice(Math.max(0, selectedTeams.length - 10)).forEach(function (id) {
        id = teamNames[id]['id']
        data.push(radarData[id]);
        colors.push("#" + teamColors[id])
        names.push("<strong><span class='selected-team' id='selected-team-" + String(id) + "' style='color:#" + teamColors[id] + "'>" + radarData[id][0].name + "</span></strong>");
        i += 1;
    });
    document.getElementsByClassName('comparedTeamsTitle')[0].innerHTML = 'Compare: ' + names.join(', ');
    $(document).on('click', '.selected-team', function () {
        var id = parseInt($(this).attr('id').replace('selected-team-', ''));
        d3.select('#team-' + String(i)).style('background-color', '#fff');
        delete selectedTeams[selectedTeams.indexOf(id)];
        drawComparedTeam();
    });
    drawDashboard(data, 'comparedTeams', size, _top, right, bottom, left, maxValue, colors);
}

function drawDashboard(data, className, size, _top, right, bottom, left, maxValue, colors) {
    var margin = {
            top: _top,
            right: right,
            bottom: bottom,
            left: left
        },
        width = Math.min(size, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
    var radarChartOptions = {
        w: width,
        h: height,
        margin: margin,
        maxValue: maxValue,
        levels: 10,
        roundStrokes: false,
        desc: true,
        // strokeWidth: 5,
        dotRadius: 0,
        opacityCircles: 0.3,
        // opacityArea: 0.2,
        color: function (e) {
            return colors[e]
        }
    };
    RadarChart(className, data, radarChartOptions);
}