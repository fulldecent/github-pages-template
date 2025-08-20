// test-unused-assets-fixtures.mjs
import { execSync } from 'child_process';
import path from 'path';

const testFixtures = [
  {
    name: 'clean fixture (no unused assets)',
    path: 'test/fixtures/unused-assets/clean',
    expectedExitCode: 0,
    shouldContain: ['✨ No unused asset files found!']
  },
  {
    name: 'with-unused fixture (has unused assets)',
    path: 'test/fixtures/unused-assets/with-unused',
    expectedExitCode: 1,
    shouldContain: ['Found 2 unused asset files', 'assets/js/really-unused.js', 'assets/images/unused.png']
  }
];

console.log('🧪 Testing unused assets checker against fixtures');

let allTestsPassed = true;

for (const test of testFixtures) {
  console.log(`\n📋 Testing: ${test.name}`);
  
  try {
    const output = execSync(`yarn node test/find-unused-assets.mjs ${test.path}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (test.expectedExitCode !== 0) {
      console.log(`❌ Expected exit code ${test.expectedExitCode}, got 0`);
      allTestsPassed = false;
      continue;
    }
    
    // Check expected content
    for (const expected of test.shouldContain) {
      if (!output.includes(expected)) {
        console.log(`❌ Output missing expected text: "${expected}"`);
        console.log(`   Actual output: ${output}`);
        allTestsPassed = false;
      }
    }
    
    if (allTestsPassed) {
      console.log(`✅ Test passed`);
    }
    
  } catch (error) {
    // For tests expecting non-zero exit codes, this is normal
    if (test.expectedExitCode !== 0 && error.status === test.expectedExitCode) {
      const output = error.stdout + error.stderr;
      
      // Check expected content
      let testPassed = true;
      for (const expected of test.shouldContain) {
        if (!output.includes(expected)) {
          console.log(`❌ Output missing expected text: "${expected}"`);
          console.log(`   Actual output: ${output}`);
          testPassed = false;
          allTestsPassed = false;
        }
      }
      
      if (testPassed) {
        console.log(`✅ Test passed (expected exit code ${test.expectedExitCode})`);
      }
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
      console.log(`   Status: ${error.status}, Expected: ${test.expectedExitCode}`);
      allTestsPassed = false;
    }
  }
}

if (allTestsPassed) {
  console.log('\n✨ All fixture tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some fixture tests failed!');
  process.exit(1);
}