module.exports = {
  plain: {
    color: '#f7f2ea',
    backgroundColor: '#453D3F'
  },
  styles: [
    {
      types: ['prolog', 'constant', 'builtin'],
      style: {
        color: '#F05B4F'
      }
    },
    {
      types: ['inserted', 'function'],
      style: {
        color: '#F05B4F'
      }
    },
    {
      types: ['deleted'],
      style: {
        color: 'rgb(255, 85, 85)'
      }
    },
    {
      types: ['changed'],
      style: {
        color: 'rgb(255, 184, 108)'
      }
    },
    {
      types: ['punctuation', 'symbol'],
      style: {
        color: '#f7f2ea'
      }
    },
    {
      types: ['number'],
      style: {
        color: '#F4C63D'
      }
    },
    {
      types: ['string', 'char', 'tag', 'selector'],
      style: {
        color: '#F4C63D'
      }
    },
    {
      types: ['keyword', 'variable'],
      style: {
        color: '#F05B4F',
        fontStyle: 'italic'
      }
    },
    {
      types: ['comment'],
      style: {
        color: '#7b6d70'
      }
    },
    {
      types: ['attr-name'],
      style: {
        color: '#F4C63D'
      }
    }
  ]
};
