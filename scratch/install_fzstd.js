const { execSync } = require('child_process');
try {
  console.log('Attempting to install fzstd...');
  execSync('npm install fzstd', { stdio: 'inherit' });
  console.log('Successfully installed fzstd');
} catch (e) {
  console.error('Failed to install fzstd:', e.message);
}
