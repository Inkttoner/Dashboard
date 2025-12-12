const { shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const DEFAULT_SCRIPTS_DIR = path.join(__dirname, "scripts");

const DEFAULT_CONFIG = {
	scriptsDir: DEFAULT_SCRIPTS_DIR,
	study: {
		title: "Start Study Session",
		message: "Choose how long you'd like to focus.",
		alertMinutes: [10, 5, 1],
		durationOptions: [
			{ id: "25", label: "25 minutes", minutes: 25 },
			{ id: "45", label: "45 minutes", minutes: 45 },
			{ id: "60", label: "60 minutes", minutes: 60 },
			{ id: "90", label: "90 minutes", minutes: 90 },
		],
		blockScripts: [
			{ file: "block-websites.ps1", optional: true },
			{ file: "block-distractions.ps1", optional: true },
		],
		appsToLaunch: [
			{
				id: "spotify",
				label: "Spotify",
				target: "spotify",
				optional: true,
			},
			{
				id: "obsidian",
				label: "Obsidian",
				target: "C:\\Users\\Coen\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Obsidian.lnk",
				optional: true,
			},
		],
	},
	gaming: {
		title: "Start Gaming Session",
		message: "Pick the game you want to launch.",
		defaultTimerMinutes: 60,
		alertMinutes: [15, 5],
		games: [
			{ id: "steam", label: "Steam Library", target: "steam" },
			{
				id: "minecraft",
				label: "Minecraft",
				target: "C:\\XboxGames\\Minecraft Launcher\\Content\\gamelaunchhelper.exe",
				optional: true,
			},
		],
		preLaunchScripts: [
			{ file: "close-productivity-tools.ps1", optional: true },
		],
		websites: [],
	},
	coding: {
		title: "Start Coding Session",
		message: "Select the IDE you'd like to open.",
		defaultTimerMinutes: 90,
		alertMinutes: [30, 10, 5],
		ides: [
			{
				id: "cursor",
				label: "Cursor",
				target: path.join(
					process.env.LOCALAPPDATA || "",
					"Programs",
					"Cursor",
					"Cursor.exe"
				),
				optional: true,
			},
			{
				id: "vscode",
				label: "Visual Studio Code",
				target: path.join(
					process.env.LOCALAPPDATA || "",
					"Programs",
					"Microsoft VS Code",
					"Code.exe"
				),
				optional: true,
			},
		],
		extraApps: [
			{
				id: "gitkraken",
				label: "GitKraken",
				target: "C:\\Users\\Coen\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\GitKraken\\GitKraken.lnk",
				optional: true,
			},
		],
		websites: ["https://github.com"],
	},
};

function normaliseDescriptor(entry, defaultKey = "target") {
	if (typeof entry === "string") {
		return { [defaultKey]: entry };
	}
	if (!entry || typeof entry !== "object") {
		throw new Error("Invalid descriptor passed to normaliseDescriptor.");
	}
	return entry;
}

function resolveArgs(args, context) {
	if (!Array.isArray(args)) {
		return [];
	}

	return args.map((arg) => {
		if (typeof arg === "function") {
			return arg(context);
		}
		if (typeof arg === "string") {
			return arg.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
				const value = context?.[key];
				return value == null ? "" : String(value);
			});
		}
		return String(arg);
	});
}

function fileExists(targetPath) {
	try {
		return fs.existsSync(targetPath);
	} catch (error) {
		console.warn(`[sessions] Failed to access ${targetPath}:`, error);
		return false;
	}
}

function runPowerShellCommand(command, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(
			"powershell.exe",
			[
				"-NoProfile",
				"-NonInteractive",
				"-ExecutionPolicy",
				"Bypass",
				"-Command",
				command,
			],
			{
				windowsHide: true,
				cwd: options.cwd || undefined,
			}
		);

		child.once("error", (error) => {
			reject(error);
		});

		child.once("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`PowerShell command exited with code ${code}. Command: ${command}`
					)
				);
			}
		});
	});
}

function escapeForPowerShell(value) {
	return String(value).replace(/'/g, "''");
}

async function runPowerShellScript(descriptor, context, scriptsDir) {
	const entry = normaliseDescriptor(descriptor, "file");
	const baseDir =
		scriptsDir || DEFAULT_CONFIG.scriptsDir || DEFAULT_SCRIPTS_DIR;
	const scriptPath = path.isAbsolute(entry.file)
		? entry.file
		: path.join(baseDir, entry.file);

	if (!fileExists(scriptPath)) {
		const message = `[sessions] Skipping missing script ${scriptPath}`;
		if (entry.optional) {
			console.warn(message);
			return { skipped: true, reason: "missing" };
		}
		throw new Error(message);
	}

	const args = resolveArgs(entry.args, context);

	await new Promise((resolve, reject) => {
		const child = spawn(
			"powershell.exe",
			[
				"-NoProfile",
				"-NonInteractive",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				scriptPath,
				...args,
			],
			{ windowsHide: true }
		);

		child.once("error", reject);
		child.once("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`Script ${scriptPath} exited with code ${code}${
							args.length ? ` (args: ${args.join(", ")})` : ""
						}`
					)
				);
			}
		});
	});

	return { skipped: false };
}

async function launchWindowsTarget(descriptor, context) {
	const entry = normaliseDescriptor(descriptor);

	if (!entry.target) {
		throw new Error("Target not provided for launchWindowsTarget.");
	}

	const args = resolveArgs(entry.args, context);

	if (path.isAbsolute(entry.target) && !fileExists(entry.target)) {
		const message = `[sessions] Skipping missing application ${entry.target}`;
		if (entry.optional) {
			console.warn(message);
			return { skipped: true, reason: "missing" };
		}
		throw new Error(message);
	}

	const escapedTarget = escapeForPowerShell(entry.target);
	const escapedArgs = args
		.map((arg) => `'${escapeForPowerShell(arg)}'`)
		.join(", ");

	const commandParts = [`Start-Process -FilePath '${escapedTarget}'`];
	if (escapedArgs) {
		commandParts.push(`-ArgumentList ${escapedArgs}`);
	}
	if (entry.workingDirectory) {
		commandParts.push(
			`-WorkingDirectory '${escapeForPowerShell(entry.workingDirectory)}'`
		);
	}

	await runPowerShellCommand(commandParts.join(" "));

	return { skipped: false };
}

function sanitizeStudyOptions(config) {
	return {
		title: config.title,
		message: config.message,
		defaultTimerMinutes: config.defaultTimerMinutes ?? null,
		alertMinutes: Array.isArray(config.alertMinutes)
			? Array.from(
					new Set(
						config.alertMinutes.filter(
							(value) => typeof value === "number" && value >= 0
						)
					)
			  ).sort((a, b) => b - a)
			: [],
		durationOptions: (config.durationOptions || []).map((option) => ({
			id: option.id ?? String(option.minutes ?? option.value),
			label: option.label,
			minutes: option.minutes ?? option.value ?? null,
		})),
	};
}

function sanitizeGamingOptions(config) {
	return {
		title: config.title,
		message: config.message,
		defaultTimerMinutes: config.defaultTimerMinutes ?? null,
		alertMinutes: Array.isArray(config.alertMinutes)
			? Array.from(
					new Set(
						config.alertMinutes.filter(
							(value) => typeof value === "number" && value >= 0
						)
					)
			  ).sort((a, b) => b - a)
			: [],
		games: (config.games || []).map((game) => ({
			id: game.id ?? game.label,
			label: game.label,
		})),
		defaultWebsites: Array.isArray(config.websites) ? config.websites : [],
	};
}

function sanitizeCodingOptions(config) {
	return {
		title: config.title,
		message: config.message,
		defaultTimerMinutes: config.defaultTimerMinutes ?? null,
		alertMinutes: Array.isArray(config.alertMinutes)
			? Array.from(
					new Set(
						config.alertMinutes.filter(
							(value) => typeof value === "number" && value >= 0
						)
					)
			  ).sort((a, b) => b - a)
			: [],
		ides: (config.ides || []).map((ide) => ({
			id: ide.id ?? ide.label,
			label: ide.label,
		})),
		defaultWebsites: Array.isArray(config.websites) ? config.websites : [],
	};
}

function sanitizeConfigForRenderer(config) {
	return {
		study: sanitizeStudyOptions(config.study || DEFAULT_CONFIG.study),
		gaming: sanitizeGamingOptions(config.gaming || DEFAULT_CONFIG.gaming),
		coding: sanitizeCodingOptions(config.coding || DEFAULT_CONFIG.coding),
	};
}

async function startStudySession(payload = {}, configOverrides = {}) {
	const config = {
		...DEFAULT_CONFIG.study,
		...configOverrides,
	};
	const scriptsDir =
		config.scriptsDir || DEFAULT_CONFIG.scriptsDir || DEFAULT_SCRIPTS_DIR;

	let durationMinutes = null;
	let durationLabel = null;

	if (
		typeof payload.durationMinutes === "number" &&
		payload.durationMinutes > 0
	) {
		durationMinutes = payload.durationMinutes;
		durationLabel = `${payload.durationMinutes} minutes`;
	} else if (payload.durationId) {
		const matchedOption = (config.durationOptions || []).find(
			(option) =>
				option.id === payload.durationId ||
				String(option.id) === String(payload.durationId)
		);
		if (matchedOption) {
			durationMinutes = matchedOption.minutes ?? matchedOption.value;
			durationLabel = matchedOption.label ?? `${durationMinutes} minutes`;
		}
	}

	if (!durationMinutes && Array.isArray(config.durationOptions)) {
		const fallback = config.durationOptions[0];
		if (fallback) {
			durationMinutes = fallback.minutes ?? fallback.value;
			durationLabel = fallback.label ?? `${durationMinutes} minutes`;
		}
	}

	if (!durationMinutes) {
		throw new Error("No study duration provided.");
	}

	const context = {
		mode: "study",
		duration: durationMinutes,
		durationLabel,
	};

	if (Array.isArray(config.blockScripts) && config.blockScripts.length > 0) {
		for (const scriptDescriptor of config.blockScripts) {
			try {
				await runPowerShellScript(
					scriptDescriptor,
					context,
					scriptsDir
				);
			} catch (error) {
				console.error("[sessions] Study session script failed:", error);
				if (!scriptDescriptor.optional) {
					throw error;
				}
			}
		}
	}

	if (Array.isArray(config.appsToLaunch)) {
		for (const appDescriptor of config.appsToLaunch) {
			try {
				await launchWindowsTarget(appDescriptor, context);
			} catch (error) {
				console.error("[sessions] Failed to launch study app:", error);
				if (!appDescriptor.optional) {
					throw error;
				}
			}
		}
	}

	return {
		cancelled: false,
		durationMinutes,
	};
}

async function startGamingSession(payload = {}, configOverrides = {}) {
	const config = {
		...DEFAULT_CONFIG.gaming,
		...configOverrides,
	};
	const scriptsDir =
		config.scriptsDir || DEFAULT_CONFIG.scriptsDir || DEFAULT_SCRIPTS_DIR;

	const gameId = payload.gameId;
	const selectedGame = (config.games || []).find(
		(game) =>
			game.id === gameId ||
			game.label === gameId ||
			String(game.id) === String(gameId)
	);

	if (!selectedGame) {
		throw new Error("No game selection provided for the gaming session.");
	}

	const context = { game: selectedGame.label, mode: "gaming" };

	if (Array.isArray(config.preLaunchScripts)) {
		for (const scriptDescriptor of config.preLaunchScripts) {
			try {
				await runPowerShellScript(
					scriptDescriptor,
					context,
					scriptsDir
				);
			} catch (error) {
				console.error(
					"[sessions] Gaming pre-launch script failed:",
					error
				);
				if (!scriptDescriptor.optional) {
					throw error;
				}
			}
		}
	}

	try {
		await launchWindowsTarget(selectedGame, context);
	} catch (error) {
		console.error("[sessions] Failed to launch selected game:", error);
		if (!selectedGame.optional) {
			throw error;
		}
	}

	const websitesToOpen = [
		...(Array.isArray(config.websites) ? config.websites : []),
		...(Array.isArray(payload.websites)
			? payload.websites.filter(
					(url) => typeof url === "string" && url.trim()
			  )
			: []),
	];

	for (const url of websitesToOpen) {
		try {
			await shell.openExternal(url);
		} catch (error) {
			console.error(`[sessions] Failed to open ${url}:`, error);
		}
	}

	return {
		cancelled: false,
		game: selectedGame.label,
	};
}

async function startCodingSession(payload = {}, configOverrides = {}) {
	const config = {
		...DEFAULT_CONFIG.coding,
		...configOverrides,
	};

	const ideId = payload.ideId;
	const selectedIde = (config.ides || []).find(
		(ide) =>
			ide.id === ideId ||
			ide.label === ideId ||
			String(ide.id) === String(ideId)
	);

	if (!selectedIde) {
		throw new Error("No IDE selection provided for the coding session.");
	}

	const context = { ide: selectedIde.label, mode: "coding" };

	try {
		await launchWindowsTarget(selectedIde, context);
	} catch (error) {
		console.error("[sessions] Failed to launch IDE:", error);
		if (!selectedIde.optional) {
			throw error;
		}
	}

	if (Array.isArray(config.extraApps)) {
		for (const appDescriptor of config.extraApps) {
			try {
				await launchWindowsTarget(appDescriptor, context);
			} catch (error) {
				console.error("[sessions] Failed to launch extra app:", error);
				if (!appDescriptor.optional) {
					throw error;
				}
			}
		}
	}

	const websitesToOpen = [
		...(Array.isArray(config.websites) ? config.websites : []),
		...(Array.isArray(payload.websites)
			? payload.websites.filter(
					(url) => typeof url === "string" && url.trim()
			  )
			: []),
	];

	for (const url of websitesToOpen) {
		if (!url) {
			continue;
		}
		try {
			await shell.openExternal(url);
		} catch (error) {
			console.error(`[sessions] Failed to open ${url}:`, error);
		}
	}

	return {
		cancelled: false,
		ide: selectedIde.label,
	};
}

function buildResolvedConfig(config = {}) {
	const resolved = {
		scriptsDir: config.scriptsDir || DEFAULT_CONFIG.scriptsDir,
		study: { ...DEFAULT_CONFIG.study, ...(config.study || {}) },
		gaming: { ...DEFAULT_CONFIG.gaming, ...(config.gaming || {}) },
		coding: { ...DEFAULT_CONFIG.coding, ...(config.coding || {}) },
	};

	resolved.study.scriptsDir =
		resolved.study.scriptsDir || resolved.scriptsDir || DEFAULT_SCRIPTS_DIR;
	resolved.gaming.scriptsDir =
		resolved.gaming.scriptsDir ||
		resolved.scriptsDir ||
		DEFAULT_SCRIPTS_DIR;
	resolved.coding.scriptsDir =
		resolved.coding.scriptsDir ||
		resolved.scriptsDir ||
		DEFAULT_SCRIPTS_DIR;

	return resolved;
}

function registerSessionHandlers(ipcMain, config = {}) {
	if (!ipcMain) {
		throw new Error(
			"ipcMain instance is required to register session handlers."
		);
	}

	const resolvedConfig = buildResolvedConfig(config);

	ipcMain.handle("session:get-config", async () =>
		sanitizeConfigForRenderer(resolvedConfig)
	);

	ipcMain.handle("session:start-study", async (_event, payload) =>
		startStudySession(payload, resolvedConfig.study)
	);

	ipcMain.handle("session:start-gaming", async (_event, payload) =>
		startGamingSession(payload, resolvedConfig.gaming)
	);

	ipcMain.handle("session:start-coding", async (_event, payload) =>
		startCodingSession(payload, resolvedConfig.coding)
	);
}

module.exports = {
	DEFAULT_CONFIG,
	startStudySession,
	startGamingSession,
	startCodingSession,
	registerSessionHandlers,
	sanitizeConfigForRenderer,
	buildResolvedConfig,
};
