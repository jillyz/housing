// 引用圖表Libraries
(function () {
    const scripts = [
        "https://cdn.amcharts.com/lib/5/index.js",
        "https://cdn.amcharts.com/lib/5/xy.js",
        "https://cdn.amcharts.com/lib/5/percent.js",
        "https://cdn.amcharts.com/lib/5/themes/Animated.js"
    ];

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function loadAll() {
        for (const s of scripts) {
            await loadScript(s);
        }
    }

    window.ChartUtilReady = loadAll();

})();

// 圖表建置功能
/*
    目前支援：
    1. 堆疊直條圖 stackedColumn
    2. 圓餅圖 pie
*/
const ChartUtil = {
    roots: {},

    // 建立圖表
    createChart: function (options) {

        const {
            id,
            type,
            data,
            categoryField,
            series,
            xAxisTitle,
            yAxisTitle
        } = options;

        // 避免重複建立
        if (this.roots[id]) {
            this.roots[id].dispose();
        }

        const root = am5.Root.new(id);

        this.roots[id] = root;

        root.setThemes([
            am5themes_Animated.new(root)
        ]);

        switch (type) {
            case 'stackedColumn':
                this.createStackedColumnChart(root, options);
                break;

            case 'pie':
                this.createPieChart(root, options);
                break;
        }
    },

    // 長條圖
    createStackedColumnChart: function (root, options) {

        const {
            data,
            categoryField,
            series,
            lineSeries,
            stacked = true,
            xAxisTitle,
            yAxisTitle
        } = options;

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "panX",
                wheelY: "zoomX",
                layout: root.verticalLayout
            })
        );

        // X Axis
        const xRenderer = am5xy.AxisRendererX.new(root, {
            minGridDistance: 30
        });

        xRenderer.labels.template.setAll({
            rotation: 0,
            centerY: am5.p50,
            centerX: am5.p50
        });

        xRenderer.grid.template.setAll({
            location: 1
        });

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: categoryField,
                renderer: xRenderer
            })
        );

        xAxis.data.setAll(data);

        // X軸標題
        if (xAxisTitle) {
            xAxis.children.push(
                am5.Label.new(root, {
                    text: xAxisTitle,
                    x: am5.p50,
                    centerX: am5.p50,
                    paddingTop: 10
                })
            );
        }

        // Y Axis
        const yRenderer = am5xy.AxisRendererY.new(root, {});

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                min: 0,
                renderer: yRenderer
            })
        );

        // Y軸標題
        if (yAxisTitle) {

            yAxis.children.unshift(
                am5.Label.new(root, {
                    text: yAxisTitle,
                    rotation: -90,
                    y: am5.p50,
                    centerX: am5.p50
                })
            );
        }

        // Legend
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.p50,
                x: am5.p50
            })
        );

        // Series
        series.forEach(item => {

            const chartSeries = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: item.name,
                    stacked: stacked,
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: item.field,
                    categoryXField: categoryField
                })
            );

            chartSeries.set("name", item.name);

            chartSeries.columns.template.setAll({
                tooltipText: "{name}, {categoryX}: {valueY}"
            });

            // 自訂顏色
            if (item.color) {
                chartSeries.columns.template.setAll({
                    fill: am5.color(item.color),
                    stroke: am5.color(item.color)
                });
            }

            chartSeries.data.setAll(data);

            chartSeries.appear();
        });

        // 折線疊加（選用）：例如差異金額
        if (Array.isArray(lineSeries)) {
            lineSeries.forEach(item => {

                const chartLine = chart.series.push(
                    am5xy.LineSeries.new(root, {
                        name: item.name,
                        xAxis: xAxis,
                        yAxis: yAxis,
                        valueYField: item.field,
                        categoryXField: categoryField,
                        tooltip: am5.Tooltip.new(root, {
                            labelText: "{name}, {categoryX}: {valueY}"
                        })
                    })
                );

                if (item.color) {
                    chartLine.strokes.template.setAll({
                        stroke: am5.color(item.color),
                        strokeWidth: 2
                    });
                }

                // 折線節點
                chartLine.bullets.push(function () {
                    return am5.Bullet.new(root, {
                        sprite: am5.Circle.new(root, {
                            radius: 4,
                            fill: item.color ? am5.color(item.color) : root.interfaceColors.get("background")
                        })
                    });
                });

                chartLine.data.setAll(data);

                chartLine.appear();
            });
        }

        legend.data.setAll(chart.series.values);

        chart.appear(1000, 100);
    },

    // 圓餅圖
    createPieChart: function (root, options) {

        const {
            data,
            colors
        } = options;

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category"
            })
        );

        // 自訂顏色（選用）
        if (Array.isArray(colors)) {
            series.get("colors").set("colors", colors.map(function (c) {
                return am5.color(c);
            }));
        }

        // 標籤顯示百分比
        series.labels.template.setAll({
            text: "{valuePercentTotal.formatNumber('0.0')}%"
        });

        series.data.setAll(data);

        // 圖例
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.p50,
                x: am5.p50,
                marginTop: 15
            })
        );
        legend.data.setAll(series.dataItems);

        series.appear(1000, 100);
    },

    // 清除圖表
    disposeChart: function (id) {

        if (this.roots[id]) {
            this.roots[id].dispose();
            delete this.roots[id];
        }
    }
};