/**
 * mitem - Minimalistic templating engine for JavaScript
 * @version custom
 * @link https://github.com/ygorko/miTem/tree/master
 *
 * Copyright (c) 2015-2024 Yegor Kozlov (https://ygorko.ru)
 * Licensed under the MIT license.
 *
 * Matrix Printer version: removed statements and partials, keeping expressions and filters only.
 */

/* eslint-disable no-undef */
export default function setupMiTem () {
  const miTem = {
    name: 'miTem',
    version: 'custom',
  };

  const templateSettings = {
    expression: /\{\{([\s\S]+?)\}\}/g,
    filter_param: /([\s\S]+?)(\(([^)]*)\))$/,
  };

  miTem.var = function (val) {
    this.val = val;
  };

  miTem.var.prototype.applyFilter = function (filterName, filterParameters) {
    let ret;
    if (typeof miTem.filters[filterName] !== 'undefined') {
      ret = miTem.filters[filterName](this.val, ...filterParameters);
    } else if (typeof this.val[filterName] === 'undefined') {
      throw new Error(`Filter ${filterName} is not defined`);
    } else {
      // eslint-disable-next-line prefer-spread
      ret = this.val[filterName].apply(this.val, filterParameters);
    }
    this.val = ret;
    return this;
  };

  miTem.var.prototype.toString = function () {
    return this.val;
  };

  miTem.objSize = (obj) => {
    const keys = Object.keys(obj);
    return keys.length;
  };

  miTem.restoreDefaultSettings = function () {
    miTem.settings = {
      stopOnError: false,
    };
  };

  miTem.restoreDefaultSettings();

  miTem.defaultFilters = {
    default: (v, fallback) => v ?? fallback,
	abs: v => Math.abs(v),
	capitalize: s => s.charAt(0).toUpperCase() + s.slice(1),
	nl2br: s => s.replace(/\n/gi, '<br />'),
	title: s => s.split(' ').map(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()).join(' '),
  };

  miTem.filters = Object.assign({}, miTem.defaultFilters);

//   if (typeof module !== 'undefined' && module.exports) {
//     module.exports = miTem;
//   } else if (typeof define === 'function' && define.amd) {
//     define(() => miTem);
//   } else {
//     window.miTem = miTem;
//   }

  miTem.processFilters = (expression) => {
    const lexemes = expression.trim().split('|');
    let variable = `(new m.var(c.${lexemes[0]}))`;
    const filters = lexemes.slice(1);
    let filterRegexLexemes;

    filters.forEach((filter) => {
      filterRegexLexemes = templateSettings.filter_param.exec(filter.trim()) || ['', filter.trim(), '', ''];
      const parameters = filterRegexLexemes[3].split(',');
      variable += `.applyFilter('${filterRegexLexemes[1]}', [${parameters.join(',')}])`;
    });
    variable += '.toString()';

    return variable;
  };

  miTem.compile = (tmpl) => {
    let returnFunctionStr = "var c=d;var m=this.miTem;var o='";
    const strings = tmpl.split('\n');
    let newLine = '';
    let compiled = true;
    let lineNumber;
    let lineStr;
    const expressionReplaceFn = function (...args) {
      const key = args[1];
      let calculatedValue = miTem.processFilters(key.replace(/\\'/gi, "'"));
      calculatedValue = `(function(){var s=this,t;s.m=m;try{return ${calculatedValue
      }}catch(e){console.error('Line: ${parseInt(lineNumber, 10) + 1}; Error in ${
        args[0]}');`;
      if (miTem.settings.stopOnError) calculatedValue += 'throw e;';
      calculatedValue += '}})()';
      return `'+${calculatedValue}+'`;
    };
    strings.forEach((line, i) => {
      lineNumber = i;
      lineStr = line;
      returnFunctionStr += newLine;
      const currentLine = lineStr.replace(/'/gi, "\\'");
      returnFunctionStr += currentLine.replace(templateSettings.expression, expressionReplaceFn);
      newLine = "'+\"\\n\"+'";
    });

    returnFunctionStr += "'; return o;";
    if (compiled) {
      return (data) => {
        let returnFunction;
        try {
          // eslint-disable-next-line no-new-func
          returnFunction = new Function('d', returnFunctionStr);
        } catch (e) {
          console.error(returnFunctionStr);
          console.error(e);
        }
        const scope = {};
        scope.miTem = miTem;
        return returnFunction.apply(scope, [data]);
      };
    }
    return () => '';
  };

  return miTem;
}
