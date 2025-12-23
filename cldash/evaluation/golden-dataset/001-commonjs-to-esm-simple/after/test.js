// Simple test suite
import assert from 'assert';
import {  capitalize, truncate, slug  } from './index.js';

// Test capitalize
assert.strictEqual(capitalize('hello world'), 'Hello World');
assert.strictEqual(capitalize('HELLO WORLD'), 'Hello World');
console.log('✓ capitalize tests passed');

// Test truncate
assert.strictEqual(truncate('short'), 'short');
assert.strictEqual(truncate('this is a very long string that needs truncation', 20), 'this is a very lo...');
console.log('✓ truncate tests passed');

// Test slug
assert.strictEqual(slug('Hello World!'), 'hello-world');
assert.strictEqual(slug('This & That'), 'this-that');
assert.strictEqual(slug('  multiple   spaces  '), 'multiple-spaces');
console.log('✓ slug tests passed');

console.log('\n✅ All tests passed!');
