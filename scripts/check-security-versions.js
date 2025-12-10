#!/usr/bin/env node
/**
 * Security Version Checker
 * Verifies that React and Next.js versions are patched against CVE-2025-55182 (React2Shell)
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

console.log('🔒 Checking security versions for CVE-2025-55182 (React2Shell)...\n');

// Required minimum versions
const REQUIRED_VERSIONS = {
  react: '19.0.2',
  'react-dom': '19.0.2',
  next: '15.1.0'
};

// Parse version string to compare
function parseVersion(version) {
  // Remove ^, ~, >=, etc.
  const cleanVersion = version.replace(/^[\^~>=<]/, '');
  const parts = cleanVersion.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

function compareVersions(current, required) {
  const currentVer = parseVersion(current);
  const requiredVer = parseVersion(required);
  
  if (currentVer.major > requiredVer.major) return 1;
  if (currentVer.major < requiredVer.major) return -1;
  
  if (currentVer.minor > requiredVer.minor) return 1;
  if (currentVer.minor < requiredVer.minor) return -1;
  
  if (currentVer.patch > requiredVer.patch) return 1;
  if (currentVer.patch < requiredVer.patch) return -1;
  
  return 0;
}

let allSecure = true;
const results = [];

// Check React
const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
if (reactVersion) {
  const isSecure = compareVersions(reactVersion, REQUIRED_VERSIONS.react) >= 0;
  results.push({
    package: 'react',
    current: reactVersion,
    required: `>= ${REQUIRED_VERSIONS.react}`,
    secure: isSecure
  });
  if (!isSecure) allSecure = false;
}

// Check react-dom
const reactDomVersion = packageJson.dependencies?.['react-dom'] || packageJson.devDependencies?.['react-dom'];
if (reactDomVersion) {
  const isSecure = compareVersions(reactDomVersion, REQUIRED_VERSIONS['react-dom']) >= 0;
  results.push({
    package: 'react-dom',
    current: reactDomVersion,
    required: `>= ${REQUIRED_VERSIONS['react-dom']}`,
    secure: isSecure
  });
  if (!isSecure) allSecure = false;
}

// Check Next.js
const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
if (nextVersion) {
  const isSecure = compareVersions(nextVersion, REQUIRED_VERSIONS.next) >= 0;
  results.push({
    package: 'next',
    current: nextVersion,
    required: `>= ${REQUIRED_VERSIONS.next}`,
    secure: isSecure
  });
  if (!isSecure) allSecure = false;
}

// Display results
console.log('📦 Package Version Check Results:\n');
results.forEach(result => {
  const status = result.secure ? '✅' : '❌';
  console.log(`${status} ${result.package}`);
  console.log(`   Current: ${result.current}`);
  console.log(`   Required: ${result.required}`);
  console.log(`   Status: ${result.secure ? 'SECURE' : 'VULNERABLE'}\n`);
});

// Final verdict
console.log('━'.repeat(50));
if (allSecure) {
  console.log('✅ All packages are patched against CVE-2025-55182 (React2Shell)');
  console.log('✅ Your application is protected from this vulnerability\n');
  process.exit(0);
} else {
  console.log('❌ VULNERABILITY DETECTED!');
  console.log('❌ Some packages are not patched against CVE-2025-55182 (React2Shell)');
  console.log('\n⚠️  IMMEDIATE ACTION REQUIRED:');
  console.log('   1. Update React to 19.0.2 or higher');
  console.log('   2. Update react-dom to 19.0.2 or higher');
  console.log('   3. Update Next.js to 15.1.0 or higher');
  console.log('   4. Run: npm install');
  console.log('   5. Rebuild your application\n');
  process.exit(1);
}

