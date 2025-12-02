#!/usr/bin/env node
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const paths = process.argv.slice(2);

if (paths.length === 0) {
	console.error('Usage: node clean.mjs <path1> [path2] ...');
	process.exit(1);
}

for (const path of paths) {
	const resolvedPath = resolve(path);
	try {
		await rm(resolvedPath, { recursive: true, force: true });
		console.log(`Removed: ${resolvedPath}`);
	} catch (error) {
		console.error(`Failed to remove ${resolvedPath}:`, error.message);
		process.exit(1);
	}
}
