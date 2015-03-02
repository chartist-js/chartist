# Accessibility plugin for Chartist.js

This plugin generates a visually hidden table to make your Chartist charts accessible.

Please visit http://gionkunz.github.io/chartist-js/plugins.html for more information.

## Available options and their defaults

```javascript
var defaultOptions = {
  // The caption will be used as table caption and will be read by the screen reader 
  // as an introduction to the content
  caption: 'A graphical chart',
  
  // The series header is used for Bar and Line charts where a table with row headers 
  // will be created and represents the column header of the column used for the row headers. 
  // The seriesHeader should describe what the series represent as a group.
  seriesHeader: 'Series name',
  
  // Use value transform to make the chart data values more accessible. Format the numbers, 
  // add a unit or wrap them into a short sentence. The valueTransform function will receive the
  // current value as parameter and the return value is used to represent the value in the 
  // accessibility table.
  valueTransform: Chartist.noop,
  
  // Add an optional summary to the accessibility that, in addition to caption, will provide
  // more detailed information about the chart. Describe what the data means and represents.
  summary: undefined,
  
  // Specify an ID that will be used for the accessibility container element. This can be a
  // String or a function that returns a String.
  elementId: function () {
    return 'ct-accessibility-table-' + (+new Date());
  },
  
  // Override the style that is used to make the accessibility container visually hidden. This style was tested with
  // NVDA and JAWS (March 2, 2015)
  visuallyHiddenStyles: 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;'
};
```

## Sample usage for a line chart

```javascript
var chart = new Chartist.Line('.ct-chart', {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  series: [
    {name: 'Income', data: [20000, 30000, 35000, 32000, 40000, 42000, 50000, 62000, 80000, 94000, 100000, 120000]},
    {name: 'Expenses', data: [10000, 15000, 12000, 14000, 20000, 23000, 22000, 24000, 21000, 18000, 30000, 32000]}
  ]
}, {
  plugins: [
    Chartist.plugins.ctAccessibility({
      caption: 'Fiscal year 2015',
      seriesHeader: 'business numbers',
      summary: 'A graphic that shows the business numbers of the fiscal year 2015',
      valueTransform: function(value) {
        return value + ' dollar';
      }
    })
  ]
});
```

## Sample usage for a pie chart

```javascript
var chart = new Chartist.Pie('.ct-chart', {
  labels: ['Carbohydrates', 'Protein', 'Fat'],
  series: [24, 8, 2]
}, {
  plugins: [
    Chartist.plugins.ctAccessibility({
      caption: 'Nutrients of a banana',
      summary: 'A graphic that shows the nutrients of a banana',
      valueTransform: function(value) {
        var total = chart.data.series.reduce(function(prev, current) {
          return prev + current;
        }, 0);
        return Math.round(value / total * 100) + '%' + ' with ' + value + ' grams';
      }
    })
  ]
});
```

### Generated accessibility table for the above example

```html
<div style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;" id="ct-accessibility-table-1425311150915">
  <table summary="A graphic that shows the nutrients of a banana">
    <caption>Nutrients of a banana</caption>
    <tbody>
      <tr>
        <th scope="col" role="columnheader">Carbohydrates</th>
        <th scope="col" role="columnheader">Protein</th>
        <th scope="col" role="columnheader">Fat</th>
      </tr>
      <tr>
        <td>71% with 24 grams</td>
        <td>24% with 8 grams</td>
        <td>6% with 2 grams</td>
      </tr>
    </tbody>
  </table>
</div>
```
