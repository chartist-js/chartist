var series = [
  [
    {
      "x": 1477872000000,
      "y": 4144750
    }, {
      "x": 1480464000000,
      "y": 4157233
    }, {
      "x": 1483142400000,
      "y": 4139020
    }, {
      "x": 1485820800000,
      "y": 4100607
    }, {
      "x": 1488240000000,
      "y": 4094337
    }, {
      "x": 1490918400000,
      "y": 4169919
    }, {
      "x": 1493510400000,
      "y": 4170409
    }, {
      "x": 1496188800000,
      "y": 4087703
    }, {
      "x": 1498780800000,
      "y": 3992911
    }, {
      "x": 1501459200000,
      "y": 3931854
    }, {
      "x": 1504137600000,
      "y": 3915041
    }, {
      "x": 1506729600000,
      "y": 3895746
    }
  ],
  [
    {
      "x": 1477872000000,
      "y": 3600000
    }, {
      "x": 1480464000000,
      "y": 3600000
    }, {
      "x": 1483142400000,
      "y": 3600000
    }, {
      "x": 1485820800000,
      "y": 3600000
    }, {
      "x": 1488240000000,
      "y": 3600000
    }, {
      "x": 1490918400000,
      "y": 3600000
    }, {
      "x": 1493510400000,
      "y": 3600000
    }, {
      "x": 1496188800000,
      "y": 3600000
    }, {
      "x": 1498780800000,
      "y": 3600000
    }, {
      "x": 1501459200000,
      "y": 3600000
    }, {
      "x": 1504137600000,
      "y": 3600000
    }, {
      "x": 1506729600000,
      "y": 3600000
    }
  ],
  []
];

function generateMonthlyTicks(range) {
    var startDate = range.min;
    var endDate = range.max;
    var date = new Date(startDate);
    var year = date.getFullYear();
    var month = date.getMonth();
    var ticks = [];
    var removeEven = (endDate - startDate > 1000 * 60 * 60 * 24 * 200)

    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);
    date.setDate(1);

    do {
        month++;
        date.setFullYear(year + Math.floor(month/12), month % 12);

        if (!removeEven || (month % 2 === 0)) {
            ticks.push(date.valueOf());
        }
    } while (date < endDate);

    return ticks;
}

let options = {
    showPoint: false,
    showArea: false,
    fullWidth: true,
    chartPadding: {
        right: 15,
    },
    axisX: {
        showGrid: false,
        scaleMinSpace: 60,
        showTicks: true,
        labelOffset: {
            x: -10,
            y: 5,
        },
        tickGenerator: generateMonthlyTicks,
        labelInterpolationFnc: (value) => {
            const date = new Date(value);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            var monthName = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(date);

            return `${monthIndex === 0 ? year : monthName}`;
        },
    },
    axisY: {
        autoScaleMargin: 0.25,
        scaleMinSpace: 30,
        offset: 60,
        labelOffset: {
            x: 0,
            y: 5,
        },
        labelInterpolationFnc: value => Math.round(value).toLocaleString(),
    },
    plugins: [
        {
            name: 'tooltip2',
            options: {
                valueTransformFunction: value => Math.round(value).toLocaleString(),
                xValueTransformFunction: value => {
                    const date = new Date(value);
                    return new Intl.DateTimeFormat('en-US', {year: 'numeric', day: 'numeric', month: 'short'}).format(date);
                },
                template: '<span>{{value}}</span>',
            },
        },
    ],
};

var chart = new Chartist.Line('.ct-chart', {series: series}, options);

chart.update({series: series}, options);
