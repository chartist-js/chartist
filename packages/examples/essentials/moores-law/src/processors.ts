// Transistors per processor, as Wikipedia's "Transistor count" list gives
// them: from Intel's 4004 to Apple's M1 Ultra.
export const processors = [
  { name: 'Intel 4004', x: 1971, y: 2_250 },
  { name: 'Intel 8080', x: 1974, y: 6_000 },
  { name: 'Intel 8086', x: 1978, y: 29_000 },
  { name: 'Intel 80286', x: 1982, y: 134_000 },
  { name: 'Intel 80386', x: 1985, y: 275_000 },
  { name: 'Intel 80486', x: 1989, y: 1_180_235 },
  { name: 'Pentium', x: 1993, y: 3_100_000 },
  { name: 'Pentium II', x: 1997, y: 7_500_000 },
  { name: 'Pentium III', x: 1999, y: 9_500_000 },
  { name: 'Pentium 4', x: 2000, y: 42_000_000 },
  { name: 'Core 2 Duo', x: 2006, y: 291_000_000 },
  { name: 'Core i7', x: 2008, y: 731_000_000 },
  { name: 'Apple A7', x: 2013, y: 1_000_000_000 },
  { name: 'Apple M1', x: 2020, y: 16_000_000_000 },
  { name: 'Apple M1 Ultra', x: 2022, y: 114_000_000_000 }
];
