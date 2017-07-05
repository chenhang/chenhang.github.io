var teamsData, teamNames, selectTeam,
	TABLE_HEADERS = ['Name'];
d3.json("passes.json", function(data) {
	teamsData = data;
	teamNames = [];
	Object.keys(teamsData).forEach(function(key, index) {
		teamNames.push({id: key, nameUniq: key,  name: key })
	});
	selectTeam = 'GSW'
	drawTable();
	drawCombinedPasses(data[selectTeam].combined)
});

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
            if (selectTeam != d.nameUniq) {
                d3.select('#team-' + String(i)).style('background-color', '#fff');
            }
        })
        .on("click", function (d, i) {
            if (selectTeam != d.nameUniq) {
                d3.select('#team-' + String(i)).style('background-color', '#f1f1f1');
                selectTeam = d.nameUniq;
								console.log(d)
								document.getElementsByClassName('teamPassesTitle')[0].innerHTML = 'Team Passes: ' + d.name;
								drawCombinedPasses(teamsData[selectTeam].combined)
            }
        });
    rows.selectAll('td')
        .data(function (row) {
            return TABLE_HEADERS.map(function (column, index) {
                return {column: column, value: row.name};
            });
        })
        .enter()
        .append('td')
        .text(function (d) {
            return d.value;
        });
}
function drawCombinedPasses(json) {
	var scaleh = d3.scale.linear();
	var scalev = d3.scale.linear();
	var width = 1150,
	height = 720;

	function fx(d) { return d.x; };
	function fy(d) { return d.y; };

	var rollup = d3.rollup()
	.x(function(d) { return fx(d); })
	.y(function(d) { return fy(d); });

	//var svg;

	d3.xml("court.svg", function(xml) {
	d3.select('.passesCourt').remove();
	// var svg = d3.select('.courtWrapper').append('svg').attr('class', 'passesCourt').attr("width", width).attr("height", height)
	svgdom = document.getElementsByClassName('courtWrapper')[0].appendChild(xml.documentElement);
	var svg = d3.select("svg");
	var defs = d3.select("defs");


	scaleh.domain([0, width]);
	scaleh.range([0, 1268]);
	scalev.domain([0, height]);
	scalev.range([0, 808]);



	datap = json.nodes;

	var datap_start = datap.filter( function (el){
	return el.Status == "starting"; });

	json.nodes = datap_start;
	var graph = rollup(json);
	graph.links.forEach(function(link) {
		link.value = 0
		link.links.forEach(function(d){
			link.value += d.time
		});
	});
	var link = svg.selectAll(".link")
	.data(graph.links)
	.enter().append("g")
	.attr("class", "linkg");

	svg.selectAll(".linkg")
	.data(graph.links)
	.append("path")
	.attr("class", function(d) {
		return "link " + "from" + d.source.nodes[0].Number + " to" + d.target.nodes[0].Number;
		})
	.attr("id" ,function(d) {
		return "link" + "from" + d.source.nodes[0].Number + "to" + d.target.nodes[0].Number;
		})
	.attr("d", function(d) {
		var sx = d.source.x, sy = d.source.y,
		tx = d.target.x, ty = d.target.y,
		dx = tx - sx, dy = ty - sy,
		dr = 2 * Math.sqrt(dx * dx + dy * dy);
		return "M" + sx + "," + sy + "A" + dr + "," + dr + " 0 0,1 " + tx + "," + ty;
		})
	.style("stroke", "grey")
	.style("stroke-width", function(d) {
		return d.value / 50;
		});

	var node = svg.selectAll(".node")
	.data(graph.nodes)
	.enter().append("g")
	.attr("class", "node")
	.style("pointer-events", "all")
	.append("circle")
	.attr("cx", function(d, i){
		return d.x})
	.attr("cy", function(d, i){ return d.y})
	.attr("r", 30)
	.attr("filter","url(#f3)")
	.style("fill", "white")
	.style("stroke", "grey")
	.style("stroke-width", "1")
	.on("mouseover", function(d) {

		var xPosition = scaleh(50 + parseFloat(d3.select(this).attr("cx")));
		var yPosition = scalev(10 + parseFloat(d3.select(this).attr("cy")));

		d3.selectAll(".to" + d.nodes[0].Number + ":not(.pathlabel)")
		.transition()
		.duration(10)
		.style("stroke", "orange")
		.style("display", "block")
		.style("stroke-opacity", ".7")
		;

		d3.selectAll(".from" + d.nodes[0].Number + ":not(.pathlabel)")
		.transition()
		.duration(10)
		.style("stroke", "blue")
		.style("display", "block")
		.style("stroke-opacity", ".7")
		;

		d3.selectAll(".pathlabel.to" + d.nodes[0].Number)
		.style("fill", "orange")
		.style("stroke", "white")
		.style("display", "block");

		d3.selectAll(".pathlabel.from" + d.nodes[0].Number)
		.style("fill", "blue")
		.style("stroke", "white")
		.style("display", "block");

		d3.select(this).style("fill", "LightGoldenRodYellow");

		d3.select("#tooltip")
			.style("left", xPosition + "px")
			.style("top", yPosition + "px")
			.select("#name")
			.text(d.nodes[0].name);

		d3.select("#tooltip")
			.select("#number")
			.text(d.nodes[0].Number);

			d3.select("#tooltip")
			.select("#pos")
			.text(d.nodes[0].Position);

		// d3.select("#tooltip").classed("hidden", false);

	})
	.on("mouseout", function(d) {

		d3.selectAll(".to" + d.nodes[0].Number + ":not(.pathlabel)")
		.style("stroke", "grey")
		.style("stroke-opacity", ".2");

		d3.selectAll(".from" + d.nodes[0].Number + ":not(.pathlabel)")
		.style("stroke", "grey")
		.style("stroke-opacity", ".2");

		d3.selectAll(".pathlabel")
		.style("fill", "grey")
		.style("display", "none");

		d3.select("#tooltip").classed("hidden", true);
		d3.select(this).style("fill", "white");
	});

	svg.selectAll(".node")
		.data(graph.nodes)
		.append("text")
		 .text(function(d, i) {
			return d.nodes[0].name;
		 })
		 .attr("x", function(d, i) {
			return d.x;
		 })
		 .attr("y", function(d, i) {
			return d.y;
		 })
		 .attr("dy", "-1.8em")
		 .style("font-family", "sans-serif")
		 .style("font-size", "10px")
		 .style("text-anchor", "middle")
		 .style("pointer-events", "none")
		 .call(wrap, 10);

	 svg.selectAll("textpaths")
		.data(graph.links)
		.enter()
		.append("text")
		.style("font-size", "12px")
		.attr("class", "texts")
		.attr("x", "0")
		.attr("y", "0")
		.append("textPath")
		.attr("class", function(d) {
			return "pathlabel " + "from" + d.source.nodes[0].Number + " to" + d.target.nodes[0].Number;
		})
		.attr("xlink:href", function(d) {
			return '#' + "link" + "from" + d.source.nodes[0].Number + "to" + d.target.nodes[0].Number
		})
		.text(function(d) {
			return //d.value;
		})
		.attr("startOffset", "40%")
		.style("stroke", "black")
		.attr("filter","url(#f3)")
		.style("fill", "white")
		.style("display", "none");

	});
	function wrap(text, width) {
			text.each(function () {
					var text = d3.select(this),
							words = text.text().split(/\s+/).reverse(),
							word,
							line = [],
							lineNumber = 0,
							lineHeight = 1.4, // ems
							y = text.attr("y"),
							x = text.attr("x"),
							dy = parseFloat(text.attr("dy")),
							tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

					while (word = words.pop()) {
							line.push(word);
							tspan.text(line.join(" "));
							if (tspan.node().getComputedTextLength() > width) {
									line.pop();
									tspan.text(line.join(" "));
									line = [word];
									tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
							}
					}
			});
	}//wrap

}
