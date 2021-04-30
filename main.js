import runTests from './lib/tests';

const testContainer = document.createElement('div');
document.body.appendChild(testContainer);
runTests(testContainer);
