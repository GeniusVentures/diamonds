#!/usr/bin/env node

/**
 * Security Commit Message Validation
 * Validates that security-related commits follow proper patterns
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecurityValidationRule {
	test: boolean;
	message: string;
}

interface SecurityLogEntry {
	timestamp: string;
	commit: string;
	validation: 'PASSED' | 'FAILED';
	issues?: string[];
}

// Get commit message from git
const commitMsgFile: string | undefined = process.argv[2];
if (!commitMsgFile) {
	console.error('❌ No commit message file provided');
	process.exit(1);
}

// Security: Validate commit message file path to prevent path traversal
function validateCommitMessageFile(filePath: string): string {
	// Resolve the path to prevent directory traversal
	const resolvedPath = path.resolve(filePath);

	console.error(`DEBUG: Validating path: ${filePath}`);
	console.error(`DEBUG: Resolved path: ${resolvedPath}`);
	console.error(`DEBUG: CWD: ${process.cwd()}`);

	// Find the git repository root by walking up the directory tree
	function findGitRoot(startDir: string): string | null {
		let currentDir = startDir;
		while (currentDir !== path.dirname(currentDir)) {
			// Stop at root
			const gitPath = path.join(currentDir, '.git');
			if (fs.existsSync(gitPath)) {
				// Check if it's a .git file (submodule) or directory
				const gitStat = fs.statSync(gitPath);
				if (gitStat.isFile()) {
					// Read the gitdir from the .git file
					const gitFileContent = fs.readFileSync(gitPath, 'utf8').trim();
					if (gitFileContent.startsWith('gitdir: ')) {
						const gitDirPath = path.resolve(currentDir, gitFileContent.substring(8));
						console.error(`DEBUG: Found submodule git dir: ${gitDirPath}`);
						return currentDir; // Return the submodule root
					}
				} else if (gitStat.isDirectory()) {
					console.error(`DEBUG: Found git dir: ${gitPath}`);
					return currentDir;
				}
			}
			currentDir = path.dirname(currentDir);
		}
		return null;
	}

	const gitRoot = findGitRoot(process.cwd());
	const gitDir = gitRoot ? path.join(gitRoot, '.git') : null;

	console.error(`DEBUG: Git root: ${gitRoot}`);
	console.error(`DEBUG: Git dir: ${gitDir}`);

	// Allow paths within git repository or .git directory
	if (
		gitRoot &&
		(resolvedPath.startsWith(gitRoot) || (gitDir && resolvedPath.startsWith(gitDir)))
	) {
		// Path is within git repository, check for traversal
		const relativePath = path.relative(gitRoot, resolvedPath);
		if (relativePath.startsWith('..')) {
			console.error(
				'❌ Invalid commit message file path: path traversal detected within git repository',
			);
			process.exit(1);
		}
	} else {
		// Allow absolute paths in common temporary directories (Git uses these)
		const allowedPrefixes = ['/tmp', '/var/tmp', '/private/tmp'];
		const isAllowedTemp = allowedPrefixes.some((prefix) => resolvedPath.startsWith(prefix));
		if (!isAllowedTemp) {
			console.error('❌ Invalid commit message file path: not in allowed location');
			console.error(`   Path: ${resolvedPath}`);
			console.error(`   Git root: ${gitRoot || 'not found'}`);
			console.error(`   CWD: ${process.cwd()}`);
			process.exit(1);
		}
	}

	// Additional validation: ensure it's a regular file (not a directory)
	try {
		const stats = fs.statSync(resolvedPath);
		if (!stats.isFile()) {
			console.error('❌ Commit message path is not a regular file');
			process.exit(1);
		}
	} catch (error) {
		console.error('❌ Cannot access commit message file:', (error as Error).message);
		process.exit(1);
	}

	return resolvedPath;
}

const validatedCommitMsgFile = validateCommitMessageFile(commitMsgFile);

try {
	const commitMsg: string = fs.readFileSync(validatedCommitMsgFile, 'utf8').trim();

	// Security-related commit patterns
	const securityPatterns: RegExp[] = [
		/^security:/i, // Security type commits
		/security|vulnerability|exploit|cve|audit/i, // Security keywords
		/^fix.*security/i, // Security fixes
		/^feat.*security/i, // Security features
	];

	const isSecurityCommit: boolean = securityPatterns.some((pattern: RegExp) =>
		pattern.test(commitMsg),
	);

	if (isSecurityCommit) {
		console.log('🔒 Security-related commit detected');

		// Additional validation for security commits
		const securityValidationRules: SecurityValidationRule[] = [
			{
				test: commitMsg.length > 10,
				message: 'Security commit messages must be descriptive (more than 10 characters)',
			},
			{
				test: /CVE-\d{4}-\d{4,7}/.test(commitMsg) || !/cve/i.test(commitMsg),
				message: 'If referencing CVE, use proper format: CVE-YYYY-NNNN',
			},
			{
				test:
					!/fix.*password|fix.*secret|fix.*key/i.test(commitMsg) ||
					/remove|revoke|rotate/i.test(commitMsg),
				message:
					'Security fixes involving credentials must include removal/rotation actions',
			},
		];

		const failedRules: SecurityValidationRule[] = securityValidationRules.filter(
			(rule: SecurityValidationRule) => !rule.test,
		);

		if (failedRules.length > 0) {
			console.error('❌ Security commit validation failed:');
			failedRules.forEach((rule: SecurityValidationRule) => {
				console.error(`  - ${rule.message}`);
			});

			// Log security commit for audit trail
			const logEntry: SecurityLogEntry = {
				timestamp: new Date().toISOString(),
				commit: commitMsg,
				validation: 'FAILED',
				issues: failedRules.map((r: SecurityValidationRule) => r.message),
			};

			const logFile: string = path.join(process.cwd(), 'logs', 'security-commits.log');
			const logDir: string = path.dirname(logFile);

			if (!fs.existsSync(logDir)) {
				fs.mkdirSync(logDir, { recursive: true });
			}

			fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
			console.log(`📝 Security commit logged to ${logFile}`);

			process.exit(1);
		}

		// Log successful security commit
		const logEntry: SecurityLogEntry = {
			timestamp: new Date().toISOString(),
			commit: commitMsg,
			validation: 'PASSED',
		};

		const logFile: string = path.join(process.cwd(), 'logs', 'security-commits.log');
		const logDir: string = path.dirname(logFile);

		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
		console.log('✅ Security commit validation passed');
	}
} catch (error) {
	console.error('❌ Error validating security commit:', (error as Error).message);
	process.exit(1);
}
