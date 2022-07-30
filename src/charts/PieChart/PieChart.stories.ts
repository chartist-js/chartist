import 'chartist-dev/styles';
import { PieChart } from 'chartist-dev';

export default {
  title: 'PieChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [5, 3, 4]
    },
    {
      width: 100,
      height: 100,
      chartPadding: 10
    }
  );

  return root;
}

export function Labels() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      labels: ['A', 'B', 'C'],
      series: [5, 8, 1]
    },
    {}
  );

  return root;
}

export function LabelInterpolation() {
  const root = document.createElement('div');
  const data = {
    series: [5, 3, 4]
  };
  const sum = (a: number, b: number) => a + b;

  new PieChart(root, data, {
    width: 100,
    height: 100,
    chartPadding: 10,
    labelInterpolationFnc: value =>
      `${Math.round((Number(value) / data.series.reduce(sum)) * 100)}%`
  });

  return root;
}

export function StartAngle() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [5, 3, 4]
    },
    {
      startAngle: 90
    }
  );

  return root;
}

export function SmallSlices() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [0.001, 2]
    },
    {
      width: 100,
      height: 100,
      chartPadding: 0
    }
  );

  return root;
}

export function IgnoreEmptyValues() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [1, 2, 0, 4]
    },
    {
      ignoreEmptyValues: true
    }
  );

  return root;
}

export function Donut() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [5, 3, 4]
    },
    {
      donut: true
    }
  );

  return root;
}

export function GaugeDonut() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [20, 10, 30, 40]
    },
    {
      chartPadding: 50,
      height: 500,
      width: 500,
      donut: true,
      donutWidth: 60,
      startAngle: 270,
      total: 200,
      showLabel: false
    }
  );

  return root;
}

export function RelativeDonutWidth() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [20, 10, 30, 40]
    },
    {
      chartPadding: 50,
      height: 500,
      width: 500,
      donut: true,
      donutWidth: '25%',
      showLabel: false
    }
  );

  return root;
}

export function Solid() {
  const root = document.createElement('div');

  new PieChart(
    root,
    {
      series: [20, 10, 30, 40]
    },
    {
      donut: true,
      donutWidth: 60,
      // donutSolid: true,
      startAngle: 270,
      showLabel: true
    }
  );

  return root;
}
