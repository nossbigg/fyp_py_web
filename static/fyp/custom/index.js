/**
 * Created by Gibson on 3/12/2017.
 */

$(document).ready(function () {
    init();
});

var dataMLTests = {};
var dataDatasetsInfo = {};

function init() {
    initStatsAndDataset();
    initMLTests();
}

function initStatsAndDataset() {
    var url_tgt = "/fyp/api/datasets_info";

    $.ajax({
        method: "GET",
        url: url_tgt,
        dataType: "json"
    }).done(callback);

    function callback(data) {
        dataDatasetsInfo = data;
        initDataset(data);
        loadStats(data);
    }
}

function initDataset(data) {
    var select_tgt = "#select-dataset";
    // populate dropdown
    $(select_tgt).empty();
    $.each(data, function (k, v) {
        $(select_tgt).append(
            $('<option>').attr('value', k).append(k)
        )
    });

    // add listener to select
    $(select_tgt).change(function () {
        loadDataset(data, this.value);
    });

    // load first element
    $(select_tgt).trigger('change');
}

function initMLTests() {
    var url_tgt = "/fyp/api/ml_tests_info";

    $.ajax({
        method: "GET",
        url: url_tgt,
        dataType: "json"
    }).done(callback);

    function callback(data) {
        // persist data
        dataMLTests = data;

        var select_tgt = "#select-test";
        // populate dropdown
        $(select_tgt).empty();
        $.each(data, function (k, v) {
            $(select_tgt).append(
                $('<option>').attr('value', k).append(k)
            )
        });

        // add listener to select
        $(select_tgt).change(function () {
            loadMLTest(data, this.value);
        });

        // load first element
        $(select_tgt).trigger('change');

        // build best classifiers list
        $.each(data, function (k, experiment_obj) {
            $.each(experiment_obj, function (k, collection) {
                storeBestClassifiers(collection);
            });
        });
    }
}

function loadStats(data) {
    // var div_id_tgt = "#div-stats";
    // unimplemented :P
}

function loadDataset(data, key) {
    var div_id_tgt = "#div-data";

    // clear element
    $(div_id_tgt).empty();

    var collection = data[key];

    var tbl = $('<table>').addClass('table table-striped');

    $(div_id_tgt).append(tbl);

    // tweet_proportion_type
    genTweetProportionType(collection, key, tbl);

    // tweet_proportion_labelled
    genTweetProportionLabelled(collection, key, tbl);

    // tweet_proportion_labelled_unique
    genTweetProportionLabelledUnique(collection, key, tbl);

    // tweet_distribution_retweet
    getTweetDistributionRetweet(collection, key, tbl);
}

function loadMLTest(data, key) {
    var div_id_tgt = "#div-tests";

    // get tests for collection
    var collections = data[key];

    // clear element
    $(div_id_tgt).empty();

    // display all collections
    $.each(collections, function (k, collection) {
        $(div_id_tgt).append(
            $('<label>').text("Collection: " + k)
        );
        $(div_id_tgt).append($('<br />'));

        drawForCollection(collection, div_id_tgt);

        $(div_id_tgt).append($('<br />'));
    });
}

var randomColor = (function () {
    var golden_ratio_conjugate = 0.618033988749895;
    var h = Math.random();
    var hslToRgb = function (h, s, l) {
        var r, g, b;
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return '#' + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
    };

    return function () {
        h += golden_ratio_conjugate;
        h %= 1;
        return hslToRgb(h, 0.5, 0.60);
    };
})();

function drawForCollection(collection, div_id_tgt) {
    var collection_name = collection["collection_name"];

    // display best feature vector
    var best_feature_vector = collection["best_feature"][0];
    $(div_id_tgt).append(
        $('<label>').text("Best feature vector: " + best_feature_vector)
    );
    $(div_id_tgt).append($('<br />'));

    // build feature vector comparison table
    var table = $("<table>").addClass('table table-striped');

    var headers = $('<tr>');
    var labels = ['Feature', 'Best Classifier', 'Min', 'Max', 'Mean', 'Median', 'Std Dev', '25th Percentile', '75th Percentile', 'Overall Score'];
    $.each(labels, function (i, v) {
        headers.append($('<th>').text(v));
    });
    table.append($('<thead>').append(headers));

    $.each(collection["features_tested"], function (feature_vector_name, f_detail) {
        var f_vector_best_clf = f_detail['best_classifiers'][0];
        var clf_stats = f_detail['classifier_stats'][f_vector_best_clf];
        var row = $('<tr>');

        row.append($('<td>').text(feature_vector_name));
        row.append($('<td>').text(f_vector_best_clf));

        var stats = ['min', 'max', 'mean', 'median', 'std_dev', 'percentile_25', 'percentile_75', 'overall_score'];
        $.each(stats, function (i, v) {
            var parsed = parseFloat(clf_stats[v]).toFixed(5);
            row.append($('<td>').text(parsed));
        });
        table.append(row);
    });
    $(div_id_tgt).append(table);

    // draw individual features classifier performance
    $.each(collection["features_tested"], function (feature_vector_name, f_detail) {
        $(div_id_tgt).append(
            $('<label>').text("Feature Vector: " + feature_vector_name)
        );
        $(div_id_tgt).append($('<br />'));

        var classifier_stats = f_detail["classifier_stats"];
        drawClassifierStats(classifier_stats, collection_name + "-" + feature_vector_name, div_id_tgt);
    });
}

function drawClassifierStats(classifier_stats, collection_name, tgt) {
    // draw d3 line chart
    var svg_name = "viz-ml-" + collection_name;
    drawMultiLineGraph(classifier_stats, svg_name, tgt);

    // draw table of classifiers
    var table = $("<table>").addClass('table table-striped');

    var headers = $('<tr>');
    var labels = ['Classifier', 'Min', 'Max', 'Mean', 'Median', 'Std Dev', '25th Percentile', '75th Percentile', 'Overall Score'];
    $.each(labels, function (i, v) {
        headers.append($('<th>').text(v));
    });
    table.append($('<thead>').append(headers));

    $.each(classifier_stats, function (clf_name, clf_stats) {
        var row = $('<tr>');

        row.append($('<td>').text(clf_name));

        var stats = ['min', 'max', 'mean', 'median', 'std_dev', 'percentile_25', 'percentile_75', 'overall_score'];
        $.each(stats, function (i, v) {
            var parsed = parseFloat(clf_stats[v]).toFixed(5);
            row.append($('<td>').text(parsed));
        });
        table.append(row);
    });

    $(tgt).append(table);
}

function drawMultiLineGraph(classifier_stats, svg_name, tgt) {
    svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
    svg.id = svg_name;
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '500');
    $(tgt).append(svg);

    var min_val = 1;
    var max_val = 0;
    var n_iter = 0;
    $.each(classifier_stats, function (clf_name, clf_stats) {
        if (clf_stats["min"] < min_val) {
            min_val = clf_stats["min"];
        }
        if (clf_stats["max"] > max_val) {
            max_val = clf_stats["max"];
        }
        n_iter = clf_stats["scores_accuracy"].length;
    });
    if (min_val != 0) {
        min_val -= 0.02;
    }
    if (max_val != 1) {
        max_val += 0.02;
    }

    min_val = 0;
    max_val = 1;

    var vis = d3.select("#" + svg_name),
        WIDTH = 1000,
        HEIGHT = 500,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 40
        },
        xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([1, n_iter]),
        yScale = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([min_val, max_val]),
        xAxis = d3.svg.axis()
            .scale(xScale),
        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

    vis.append("svg:g")
        .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
        .call(xAxis);

    vis.append("svg:g")
        .attr("transform", "translate(" + (MARGINS.left) + ",0)")
        .call(yAxis);


    var lineGen = d3.svg.line()
        .x(function (d) {
            return xScale(d.iter);
        })
        .y(function (d) {
            return yScale(d.acc);
        });

    $.each(classifier_stats, function (clf_name, clf_stats) {
        var data_d3 = [];
        $.each(clf_stats["scores_accuracy"], function (index, v) {
            data_d3.push({
                "clf_name": clf_name,
                "acc": v,
                "iter": index
            })
        });

        vis.append('svg:path')
            .attr('d', lineGen(data_d3))
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr("transform", "translate(" + 10 + ",0)")
            .style({'stroke': randomColor});

        var last_elem = data_d3[data_d3.length - 1];
        vis.append("text")
            .attr("transform", "translate(" + xScale(last_elem.iter) + "," + yScale(last_elem.acc) + ")")
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(last_elem.clf_name);
    });
}

function drawPieChart(data, svg_name, tgt) {
    var width = 300;
    var height = 300;
    var radius = 100;

    svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
    svg.id = svg_name;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    $(tgt).append(svg);

    var svg = d3.select("#" + svg_name)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var arc = d3.svg.arc()
        .outerRadius(radius)
        .innerRadius(30);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function (d) {
            return d.count;
        });

    var g = svg.selectAll(".fan")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "fan");

    g.append("path")
        .attr("d", arc)
        .attr("fill", randomColor);

    g.append("text")
        .attr("transform", function (d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .style("text-anchor", "middle")
        .style("text-decoration", "underline")
        .text(function (d) {
            return d.data.legend;
        });
}

function drawBarChart(data, svg_name, tgt) {
    var margin = {top: 20, right: 30, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
    svg.id = svg_name;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    $(tgt).append(svg);

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat("");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var chart = d3.select("#" + svg_name)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function (d) {
        return d.legend;
    }));
    y.domain([0, d3.max(data, function (d) {
        return d.count;
    })]);

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    chart.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.legend);
        })
        .attr("y", function (d) {
            return y(d.count);
        })
        .attr("height", function (d) {
            return height - y(d.count);
        })
        .attr("width", x.rangeBand())
        // .attr("transform", "translate(" + -40 + "," + 0 + ")")
        .attr('style', "stroke:" + randomColor());
}

function genTweetProportionType(collection, key, tbl) {
    var row = $('<tr>');
    var td1 = $('<td>');
    var td2 = $('<td>');
    row.append(td1);
    row.append(td2);
    tbl.append(row);

    $(td1).append(
        $('<label>').text("Tweets By Type")
    );
    $(td1).append($('<br />'));

    // pie chart
    d3_data = [];
    tweet_types = ['Normal', 'Retweet', 'Quote Retweet', 'Invalid']
    max_tweets = collection["tweet_count"];
    $.each(collection["tweet_proportion_type"], function (k, v) {
        d3_data.push({
            "legend": tweet_types[k],
            "count": v,
            "percentage": parseFloat(v / max_tweets * 100).toFixed(2)
        });
    });
    drawPieChart(d3_data, "viz-data-proportion-type" + key, td1);

    // table
    var subtbl = $('<table>').addClass('table table-striped');
    ;
    var subtbl_headers = $('<tr>');
    labels = ['Tweet Type', 'Count', 'Percentage'];
    $.each(labels, function (i, v) {
        subtbl_headers.append($('<th>').text(v))
    });
    subtbl.append(subtbl_headers);

    $.each(d3_data, function (k, v) {
        var row = $('<tr>');
        row.append($('<td>').text(v.legend));
        row.append($('<td>').text(v.count));
        row.append($('<td>').text(v.percentage + "%"));
        subtbl.append(row);
    });
    $(td2).append(subtbl);
}

function genTweetProportionLabelled(collection, key, tbl) {
    var row = $('<tr>');
    var td1 = $('<td>');
    var td2 = $('<td>');
    row.append(td1);
    row.append(td2);
    tbl.append(row);

    $(td1).append(
        $('<label>').text("Tweets Labelled")
    );
    $(td1).append($('<br />'));

    // if no labelled tweets
    if (Object.keys(collection["tweet_proportion_labelled"]).length == 0) {
        $(td1).append(
            $('<label>').text("No labelled tweets.")
        );
        return;
    }

    // pie chart
    d3_data = [];
    tweet_label_types = {
        "s": "Support",
        "d": "Deny",
        "n": "Neutral",
        "u": "Unrelated"
    };
    max_tweets = collection["tweet_count"];
    $.each(collection["tweet_proportion_labelled"], function (k, v) {
        d3_data.push({
            "legend": tweet_label_types[k],
            "count": v,
            "percentage": parseFloat(v / max_tweets * 100).toFixed(2)
        });
    });
    drawPieChart(d3_data, "viz-data-proportion-labelled" + key, td1);

    // add unlabeled for table
    var unlabeled_count = max_tweets;
    $.each(collection["tweet_proportion_labelled"], function (k, v) {
        unlabeled_count -= v;
    });
    d3_data.push({
        "legend": "Unlabeled",
        "count": unlabeled_count,
        "percentage": parseFloat(unlabeled_count / max_tweets * 100).toFixed(2)
    });

    // table
    var subtbl = $('<table>').addClass('table table-striped');
    ;
    var subtbl_headers = $('<tr>');
    labels = ['Tweet Label', 'Count', 'Percentage'];
    $.each(labels, function (i, v) {
        subtbl_headers.append($('<th>').text(v))
    });
    subtbl.append(subtbl_headers);

    $.each(d3_data, function (k, v) {
        var row = $('<tr>');
        row.append($('<td>').text(v.legend));
        row.append($('<td>').text(v.count));
        row.append($('<td>').text(v.percentage + "%"));
        subtbl.append(row);
    });
    $(td2).append(subtbl);
}

function genTweetProportionLabelledUnique(collection, key, tbl) {
    var row = $('<tr>');
    var td1 = $('<td>');
    var td2 = $('<td>');
    row.append(td1);
    row.append(td2);
    tbl.append(row);

    $(td1).append(
        $('<label>').text("Tweets Labelled (Unique)")
    );
    $(td1).append($('<br />'));

    // if no labelled tweets
    if (Object.keys(collection["tweet_proportion_labelled_unique"]).length == 0) {
        $(td1).append(
            $('<label>').text("No labelled tweets.")
        );
        return;
    }

    // pie chart
    var d3_data = [];
    var tweet_label_types = {
        "s": "Support",
        "d": "Deny",
        "n": "Neutral",
        "u": "Unrelated"
    };
    var max_tweets = 0;
    $.each(collection["tweet_proportion_labelled_unique"], function (k, v) {
        max_tweets += v;
    });

    $.each(collection["tweet_proportion_labelled_unique"], function (k, v) {
        d3_data.push({
            "legend": tweet_label_types[k],
            "count": v,
            "percentage": parseFloat(v / max_tweets * 100).toFixed(2)
        });
    });
    drawPieChart(d3_data, "viz-data-proportion-labelled-unique" + key, td1);

    // table
    var subtbl = $('<table>').addClass('table table-striped');
    var subtbl_headers = $('<tr>');
    var labels = ['Tweet Label', 'Count', 'Percentage'];
    $.each(labels, function (i, v) {
        subtbl_headers.append($('<th>').text(v))
    });
    subtbl.append(subtbl_headers);

    $.each(d3_data, function (k, v) {
        var row = $('<tr>');
        row.append($('<td>').text(v.legend));
        row.append($('<td>').text(v.count));
        row.append($('<td>').text(v.percentage + "%"));
        subtbl.append(row);
    });
    $(td2).append(subtbl);
}

function getTweetDistributionRetweet(collection, key, tbl) {
    var row = $('<tr>');
    var td1 = $('<td>').attr('colspan', 2);
    row.append(td1);
    tbl.append(row);

    $(td1).append(
        $('<label>').text("Tweets Retweet Distribution")
    );
    $(td1).append($('<br />'));

    // if no labelled tweets
    if (collection["tweet_distribution_retweet"].length == 0) {
        $(td1).append(
            $('<label>').text("No retweets.")
        );
        return;
    }

    // bar chart
    var d3_data = [];
    $.each(collection["tweet_distribution_retweet"], function (i, v) {
        d3_data.push({
            "legend": v[0],
            "count": v[1]
        });
    });
    drawBarChart(d3_data, "viz-data-tweet-distribution" + key, td1);
}

function storeBestClassifiers(collection) {
    $.each(collection["features_tested"], function (feature_name, obj) {
        var best_clf_foreach_clf = {};
        var clf_names = Object.keys(obj['classifier_stats']);

        $.each(clf_names, function (i, clf_name) {
            var clf_best = null;

            $.each(obj["test_iterations"], function (i, v) {
                var clf = v["classifiers_tested"][clf_name];

                if (clf_best == null || clf_best.score_accuracy < clf.score_accuracy) {
                    clf_best = clf;
                }
            });

            best_clf_foreach_clf[clf_name] = clf_best;
        });

        obj["best_clf_foreach_clf"] = best_clf_foreach_clf;
    });


}

