/**
 * The TypeScript lib declarations the type service loads: `es2022`, `dom`
 * and `dom.iterable` (the examples' `lib` setting) and every lib they
 * reference. Bundled into the worker as text, so they come from the page's
 * origin. A unit test checks that the references are complete.
 */
import lib_decorators from 'typescript/lib/lib.decorators.d.ts?raw';
import lib_decorators_legacy from 'typescript/lib/lib.decorators.legacy.d.ts?raw';
import lib_dom from 'typescript/lib/lib.dom.d.ts?raw';
import lib_dom_iterable from 'typescript/lib/lib.dom.iterable.d.ts?raw';
import lib_es2015 from 'typescript/lib/lib.es2015.d.ts?raw';
import lib_es2015_collection from 'typescript/lib/lib.es2015.collection.d.ts?raw';
import lib_es2015_core from 'typescript/lib/lib.es2015.core.d.ts?raw';
import lib_es2015_generator from 'typescript/lib/lib.es2015.generator.d.ts?raw';
import lib_es2015_iterable from 'typescript/lib/lib.es2015.iterable.d.ts?raw';
import lib_es2015_promise from 'typescript/lib/lib.es2015.promise.d.ts?raw';
import lib_es2015_proxy from 'typescript/lib/lib.es2015.proxy.d.ts?raw';
import lib_es2015_reflect from 'typescript/lib/lib.es2015.reflect.d.ts?raw';
import lib_es2015_symbol from 'typescript/lib/lib.es2015.symbol.d.ts?raw';
import lib_es2015_symbol_wellknown from 'typescript/lib/lib.es2015.symbol.wellknown.d.ts?raw';
import lib_es2016 from 'typescript/lib/lib.es2016.d.ts?raw';
import lib_es2016_array_include from 'typescript/lib/lib.es2016.array.include.d.ts?raw';
import lib_es2016_intl from 'typescript/lib/lib.es2016.intl.d.ts?raw';
import lib_es2017 from 'typescript/lib/lib.es2017.d.ts?raw';
import lib_es2017_arraybuffer from 'typescript/lib/lib.es2017.arraybuffer.d.ts?raw';
import lib_es2017_date from 'typescript/lib/lib.es2017.date.d.ts?raw';
import lib_es2017_intl from 'typescript/lib/lib.es2017.intl.d.ts?raw';
import lib_es2017_object from 'typescript/lib/lib.es2017.object.d.ts?raw';
import lib_es2017_sharedmemory from 'typescript/lib/lib.es2017.sharedmemory.d.ts?raw';
import lib_es2017_string from 'typescript/lib/lib.es2017.string.d.ts?raw';
import lib_es2017_typedarrays from 'typescript/lib/lib.es2017.typedarrays.d.ts?raw';
import lib_es2018 from 'typescript/lib/lib.es2018.d.ts?raw';
import lib_es2018_asyncgenerator from 'typescript/lib/lib.es2018.asyncgenerator.d.ts?raw';
import lib_es2018_asynciterable from 'typescript/lib/lib.es2018.asynciterable.d.ts?raw';
import lib_es2018_intl from 'typescript/lib/lib.es2018.intl.d.ts?raw';
import lib_es2018_promise from 'typescript/lib/lib.es2018.promise.d.ts?raw';
import lib_es2018_regexp from 'typescript/lib/lib.es2018.regexp.d.ts?raw';
import lib_es2019 from 'typescript/lib/lib.es2019.d.ts?raw';
import lib_es2019_array from 'typescript/lib/lib.es2019.array.d.ts?raw';
import lib_es2019_intl from 'typescript/lib/lib.es2019.intl.d.ts?raw';
import lib_es2019_object from 'typescript/lib/lib.es2019.object.d.ts?raw';
import lib_es2019_string from 'typescript/lib/lib.es2019.string.d.ts?raw';
import lib_es2019_symbol from 'typescript/lib/lib.es2019.symbol.d.ts?raw';
import lib_es2020 from 'typescript/lib/lib.es2020.d.ts?raw';
import lib_es2020_bigint from 'typescript/lib/lib.es2020.bigint.d.ts?raw';
import lib_es2020_date from 'typescript/lib/lib.es2020.date.d.ts?raw';
import lib_es2020_intl from 'typescript/lib/lib.es2020.intl.d.ts?raw';
import lib_es2020_number from 'typescript/lib/lib.es2020.number.d.ts?raw';
import lib_es2020_promise from 'typescript/lib/lib.es2020.promise.d.ts?raw';
import lib_es2020_sharedmemory from 'typescript/lib/lib.es2020.sharedmemory.d.ts?raw';
import lib_es2020_string from 'typescript/lib/lib.es2020.string.d.ts?raw';
import lib_es2020_symbol_wellknown from 'typescript/lib/lib.es2020.symbol.wellknown.d.ts?raw';
import lib_es2021 from 'typescript/lib/lib.es2021.d.ts?raw';
import lib_es2021_intl from 'typescript/lib/lib.es2021.intl.d.ts?raw';
import lib_es2021_promise from 'typescript/lib/lib.es2021.promise.d.ts?raw';
import lib_es2021_string from 'typescript/lib/lib.es2021.string.d.ts?raw';
import lib_es2021_weakref from 'typescript/lib/lib.es2021.weakref.d.ts?raw';
import lib_es2022 from 'typescript/lib/lib.es2022.d.ts?raw';
import lib_es2022_array from 'typescript/lib/lib.es2022.array.d.ts?raw';
import lib_es2022_error from 'typescript/lib/lib.es2022.error.d.ts?raw';
import lib_es2022_intl from 'typescript/lib/lib.es2022.intl.d.ts?raw';
import lib_es2022_object from 'typescript/lib/lib.es2022.object.d.ts?raw';
import lib_es2022_regexp from 'typescript/lib/lib.es2022.regexp.d.ts?raw';
import lib_es2022_string from 'typescript/lib/lib.es2022.string.d.ts?raw';
import lib_es5 from 'typescript/lib/lib.es5.d.ts?raw';

/** File name (`lib.es5.d.ts`) → content. */
export const LIBS: Record<string, string> = {
  'lib.decorators.d.ts': lib_decorators,
  'lib.decorators.legacy.d.ts': lib_decorators_legacy,
  'lib.dom.d.ts': lib_dom,
  'lib.dom.iterable.d.ts': lib_dom_iterable,
  'lib.es2015.d.ts': lib_es2015,
  'lib.es2015.collection.d.ts': lib_es2015_collection,
  'lib.es2015.core.d.ts': lib_es2015_core,
  'lib.es2015.generator.d.ts': lib_es2015_generator,
  'lib.es2015.iterable.d.ts': lib_es2015_iterable,
  'lib.es2015.promise.d.ts': lib_es2015_promise,
  'lib.es2015.proxy.d.ts': lib_es2015_proxy,
  'lib.es2015.reflect.d.ts': lib_es2015_reflect,
  'lib.es2015.symbol.d.ts': lib_es2015_symbol,
  'lib.es2015.symbol.wellknown.d.ts': lib_es2015_symbol_wellknown,
  'lib.es2016.d.ts': lib_es2016,
  'lib.es2016.array.include.d.ts': lib_es2016_array_include,
  'lib.es2016.intl.d.ts': lib_es2016_intl,
  'lib.es2017.d.ts': lib_es2017,
  'lib.es2017.arraybuffer.d.ts': lib_es2017_arraybuffer,
  'lib.es2017.date.d.ts': lib_es2017_date,
  'lib.es2017.intl.d.ts': lib_es2017_intl,
  'lib.es2017.object.d.ts': lib_es2017_object,
  'lib.es2017.sharedmemory.d.ts': lib_es2017_sharedmemory,
  'lib.es2017.string.d.ts': lib_es2017_string,
  'lib.es2017.typedarrays.d.ts': lib_es2017_typedarrays,
  'lib.es2018.d.ts': lib_es2018,
  'lib.es2018.asyncgenerator.d.ts': lib_es2018_asyncgenerator,
  'lib.es2018.asynciterable.d.ts': lib_es2018_asynciterable,
  'lib.es2018.intl.d.ts': lib_es2018_intl,
  'lib.es2018.promise.d.ts': lib_es2018_promise,
  'lib.es2018.regexp.d.ts': lib_es2018_regexp,
  'lib.es2019.d.ts': lib_es2019,
  'lib.es2019.array.d.ts': lib_es2019_array,
  'lib.es2019.intl.d.ts': lib_es2019_intl,
  'lib.es2019.object.d.ts': lib_es2019_object,
  'lib.es2019.string.d.ts': lib_es2019_string,
  'lib.es2019.symbol.d.ts': lib_es2019_symbol,
  'lib.es2020.d.ts': lib_es2020,
  'lib.es2020.bigint.d.ts': lib_es2020_bigint,
  'lib.es2020.date.d.ts': lib_es2020_date,
  'lib.es2020.intl.d.ts': lib_es2020_intl,
  'lib.es2020.number.d.ts': lib_es2020_number,
  'lib.es2020.promise.d.ts': lib_es2020_promise,
  'lib.es2020.sharedmemory.d.ts': lib_es2020_sharedmemory,
  'lib.es2020.string.d.ts': lib_es2020_string,
  'lib.es2020.symbol.wellknown.d.ts': lib_es2020_symbol_wellknown,
  'lib.es2021.d.ts': lib_es2021,
  'lib.es2021.intl.d.ts': lib_es2021_intl,
  'lib.es2021.promise.d.ts': lib_es2021_promise,
  'lib.es2021.string.d.ts': lib_es2021_string,
  'lib.es2021.weakref.d.ts': lib_es2021_weakref,
  'lib.es2022.d.ts': lib_es2022,
  'lib.es2022.array.d.ts': lib_es2022_array,
  'lib.es2022.error.d.ts': lib_es2022_error,
  'lib.es2022.intl.d.ts': lib_es2022_intl,
  'lib.es2022.object.d.ts': lib_es2022_object,
  'lib.es2022.regexp.d.ts': lib_es2022_regexp,
  'lib.es2022.string.d.ts': lib_es2022_string,
  'lib.es5.d.ts': lib_es5
};
