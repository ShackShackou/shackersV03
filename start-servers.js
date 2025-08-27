#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting ShackersV03 servers...\n');

// Kill existing processes
console.log('1. Killing existing Node processes...');
const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe', '/T'], { stdio: 'inherit' });
killProcess.on('close', (code) => {
  if (code !== 0 && code !== 128) {
    console.log('⚠️  No existing Node processes found (this is okay)');
  }
  
  // Start backend
  console.log('\n2. Starting backend server (port 4000)...');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'server'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });
  
  backend.stdout.on('data', (data) => {
    console.log(`[BACKEND] ${data}`);
  });
  
  backend.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR] ${data}`);
  });
  
  // Wait a bit then start frontend
  setTimeout(() => {
    console.log('\n3. Starting frontend server (port 5174)...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });
    
    frontend.stdout.on('data', (data) => {
      console.log(`[FRONTEND] ${data}`);
    });
    
    frontend.stderr.on('data', (data) => {
      console.error(`[FRONTEND ERROR] ${data}`);
    });
    
    setTimeout(() => {
      console.log('\n✅ Servers should be running!');
      console.log('📍 Game URL: http://localhost:5174/random-fight.html');
      console.log('📍 API URL: http://localhost:4000');
      console.log('\nPress Ctrl+C to stop all servers');
    }, 3000);
    
  }, 5000);
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  spawn('taskkill', ['/F', '/IM', 'node.exe', '/T'], { stdio: 'inherit' });
  process.exit(0);
});
