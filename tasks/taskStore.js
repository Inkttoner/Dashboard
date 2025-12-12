const fs = require("fs/promises");
const { existsSync, mkdirSync } = require("fs");
const path = require("path");

const ensureDir = (dir) => {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
};

const readJsonSafe = async (filePath, fallback) => {
	try {
		const data = await fs.readFile(filePath, { encoding: "utf-8" });
		return JSON.parse(data);
	} catch (error) {
		return fallback;
	}
};

const writeJsonSafe = async (filePath, data) => {
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), {
		encoding: "utf-8",
	});
};

class TaskStore {
	constructor(options) {
		this.dataDir = options.dataDir;
		this.tasksFileName = options.tasksFileName ?? "tasks.json";
		this.finishedFileName =
			options.finishedFileName ?? "finished-tasks.json";
		this.seedTasksFile = options.seedTasksFile;
		this.seedFinishedFile = options.seedFinishedFile;

		this.tasksFilePath = path.join(this.dataDir, this.tasksFileName);
		this.finishedFilePath = path.join(this.dataDir, this.finishedFileName);
	}

	async init() {
		ensureDir(this.dataDir);

		if (!existsSync(this.tasksFilePath)) {
			if (this.seedTasksFile && existsSync(this.seedTasksFile)) {
				await fs.copyFile(this.seedTasksFile, this.tasksFilePath);
			} else {
				await writeJsonSafe(this.tasksFilePath, { tasks: [] });
			}
		}

		if (!existsSync(this.finishedFilePath)) {
			if (this.seedFinishedFile && existsSync(this.seedFinishedFile)) {
				await fs.copyFile(this.seedFinishedFile, this.finishedFilePath);
			} else {
				await writeJsonSafe(this.finishedFilePath, { tasks: [] });
			}
		}
	}

	async listTasks() {
		const payload = await readJsonSafe(this.tasksFilePath, { tasks: [] });
		return Array.isArray(payload.tasks) ? payload.tasks : [];
	}

	async listFinishedTasks() {
		const payload = await readJsonSafe(this.finishedFilePath, {
			tasks: [],
		});
		return Array.isArray(payload.tasks) ? payload.tasks : [];
	}

	async saveTasks(tasks) {
		await writeJsonSafe(this.tasksFilePath, { tasks });
		return tasks;
	}

	async saveFinishedTasks(tasks) {
		await writeJsonSafe(this.finishedFilePath, { tasks });
		return tasks;
	}

	async addTask({ label, category, status }) {
		if (!label || typeof label !== "string") {
			throw new Error("Task label is required");
		}

		const tasks = await this.listTasks();
		const nextId =
			tasks.reduce(
				(largest, task) => Math.max(largest, task.id || 0),
				0
			) + 1;

		const newTask = {
			id: nextId,
			label: label.trim(),
			category: category?.trim() || "General",
			status: status || "Planned",
			createdAt: new Date().toISOString(),
		};

		tasks.push(newTask);
		await this.saveTasks(tasks);
		return newTask;
	}

	async updateTaskStatus(id, status) {
		if (!id) {
			throw new Error("Task id is required");
		}

		const tasks = await this.listTasks();
		const index = tasks.findIndex((task) => task.id === id);
		if (index === -1) {
			throw new Error(`Task with id ${id} not found`);
		}

		tasks[index] = {
			...tasks[index],
			status: status || tasks[index].status,
			updatedAt: new Date().toISOString(),
		};

		await this.saveTasks(tasks);
		return tasks[index];
	}

	async completeTask(id) {
		if (!id) {
			throw new Error("Task id is required");
		}

		const tasks = await this.listTasks();
		const index = tasks.findIndex((task) => task.id === id);
		if (index === -1) {
			throw new Error(`Task with id ${id} not found`);
		}

		const [completedTask] = tasks.splice(index, 1);
		const finishedTasks = await this.listFinishedTasks();

		const finishedEntry = {
			...completedTask,
			status: "Done",
			completedAt: new Date().toISOString(),
		};

		finishedTasks.unshift(finishedEntry);

		await Promise.all([
			this.saveTasks(tasks),
			this.saveFinishedTasks(finishedTasks),
		]);
		return { tasks, finishedTasks, completedTask: finishedEntry };
	}

	async clearFinishedTasks() {
		await this.saveFinishedTasks([]);
		return [];
	}
}

module.exports = TaskStore;
