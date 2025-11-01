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

	// Find the git repository root by walking up the directory tree
	function findGitRoot(startDir: string): {
		submoduleRoot: string | null;
		mainRepoRoot: string | null;
	} {
		let currentDir = startDir;
		let submoduleRoot: string | null = null;
		let mainRepoRoot: string | null = null;

		while (currentDir !== path.dirname(currentDir)) {
			// Stop at root
			const gitPath = path.join(currentDir, '.git');
			if (fs.existsSync(gitPath)) {
				const gitStat = fs.statSync(gitPath);
				if (gitStat.isFile()) {
					// This is a submodule .git file
					if (!submoduleRoot) {
						submoduleRoot = currentDir;
					}
					// Continue walking up to find the main repository
				} else if (gitStat.isDirectory()) {
					// This is a main repository .git directory
					mainRepoRoot = currentDir;
					break;
				}
			}
			currentDir = path.dirname(currentDir);
		}
		return { submoduleRoot, mainRepoRoot };
	}

	const { submoduleRoot, mainRepoRoot } = findGitRoot(process.cwd());
	const gitRoot = submoduleRoot || mainRepoRoot;
	const gitDir = gitRoot ? path.join(gitRoot, '.git') : null;

	// Allow paths within git repository, .git directory, or git modules directory
	const gitModulesDir = mainRepoRoot ? path.join(mainRepoRoot, '.git', 'modules') : null;
	const isInGitModules = gitModulesDir && resolvedPath.startsWith(gitModulesDir);

	if (
		gitRoot &&
		(resolvedPath.startsWith(gitRoot) ||
			(gitDir && resolvedPath.startsWith(gitDir)) ||
			isInGitModules)
	) {
		// Path is within git repository structure, check for traversal
		// For git modules paths, check traversal from the modules root
		const checkPath = isInGitModules ? gitModulesDir : gitRoot;
		const relativePath = path.relative(checkPath!, resolvedPath);
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
