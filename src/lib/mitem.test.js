import {test} from 'node:test';
import assert from 'node:assert/strict';
import mitem from './mitem.js';

test("Set variable", function () {
  let template = mitem.compile("hello {{who}}");
  assert.strictEqual(template({who: "world!"}), "hello world!");
  assert.strictEqual(template({who: "me"}), "hello me");
});

test("Complex variable", function () {
  let template = mitem.compile("hello {{person.name}}");
  assert.strictEqual(template({person: {name: "Alex"}}), "hello Alex");
  assert.strictEqual(template({person: {}}), "hello undefined");
});


test("Set multiple variables", function () {
  let template = mitem.compile("{{hi}} {{ who }}");
  assert.strictEqual(template({who: "me", hi: "hello"}), "hello me");

  template = mitem.compile("{{who }} {{hi}} {{ who }}");
  assert.strictEqual(template({who: "me", hi: "hello"}), "me hello me");
});

test("Multiline template", function () {
  let template = mitem.compile(`hello {{who}}
hello {{who}}
hello {{who}}
hello {{who}}
hello {{who}}
`);
  assert.strictEqual(template({who: "world!"}), `hello world!
hello world!
hello world!
hello world!
hello world!
`);

});

test("Filter default", function () {
  let template = mitem.compile("hello {{who|default('Value not set')}}");
  assert.strictEqual(template({}), "hello Value not set");

  template = mitem.compile("hello {{who|default('Value not set')}}");
  assert.strictEqual(template({who: "value"}), "hello value");
});

test("String function as filter", function () {
  let template = mitem.compile("hello {{who|repeat(2)}}");
  assert.strictEqual(template({who: "value"}), "hello valuevalue");
});

test("Array function as filter", function () {
  let template = mitem.compile("hello {{who|join(',')}}");
  assert.strictEqual(template({who: ["qw", "er"]}), "hello qw,er");
});

test("Several filters", function () {
  let template = mitem.compile("hello {{who|join(',')|repeat(2)}}");
  assert.strictEqual(template({who: ["qw", "er"]}), "hello qw,erqw,er");

  template = mitem.compile("{{ arr | join(',') | toUpperCase }}");
  assert.strictEqual(template({arr: ["qw", "er"]}), "QW,ER");
});

test("Filter doesn't exist", function () {
  let outputData = "";

  mitem.settings.stopOnError = true;

  let template = mitem.compile("hello {{who|qwe}}");
  assert.throws(_ => template({who: ["qw", "er"]}), {message: "Filter qwe is not defined"});

  outputData = "";
  template = mitem.compile("hello {{who|qwe(5)}}");
  assert.throws(_ => template({who: ["qw", "er"]}), {message: "Filter qwe is not defined"});

  mitem.settings.stopOnError = false;
  outputData = "";
  template = mitem.compile("hello {{who|qwe(5)}} world");
  assert.strictEqual(template({who: ["qw", "er"]}), "hello undefined world");
});

test("String with quotes", function () {
  let template = mitem.compile("hello '{{who}}'");
  assert.strictEqual(template({who: "world!"}), "hello 'world!'");
});

test("Filter abs", function () {
  let template = mitem.compile("hello '{{num|abs}}'");
  assert.strictEqual(template({num: 5}), "hello '5'");
  assert.strictEqual(template({num: -5}), "hello '5'");
  assert.strictEqual(template({num: 0}), "hello '0'");
});

test("Filter capitalize", function () {
  let template = mitem.compile("hello '{{who|capitalize}}'");
  assert.strictEqual(template({who: "test"}), "hello 'Test'");
  assert.strictEqual(template({who: "test test"}), "hello 'Test test'");
  assert.strictEqual(template({who: "test   test"}), "hello 'Test   test'");
  assert.strictEqual(template({who: ""}), "hello ''");
});

test("Filter nl2br", function () {
  let template = mitem.compile("hello '{{who|nl2br}}'");
  assert(template({who: `test
test`
  }), "hello 'test<br />test'");
  assert.strictEqual(template({who: "test\ntest"}), "hello 'test<br />test'");
});

test("Filter title", function () {
  let template = mitem.compile("hello '{{who|title}}'");
  assert.strictEqual(template({who: "test"}), "hello 'Test'");
  assert.strictEqual(template({who: "test   test"}), "hello 'Test   Test'");
});

test("Custom filter", function () {
	mitem.filters = Object.assign(mitem.filters, {
		reverse: str => str.split('').reverse().join('')
	});
	let template = mitem.compile("hello '{{who|reverse}}'");
	assert.strictEqual(template({who: "abcd"}), "hello 'dcba'");
});
