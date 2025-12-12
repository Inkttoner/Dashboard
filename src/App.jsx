import { useEffect, useState } from "react";
import FocusModeCard from "./components/FocusModeCard";
import FinishedTasksPanel from "./components/FinishedTasksPanel";
import QuickLinkTile from "./components/QuickLinkTile";
import StatusPill from "./components/StatusPill";
import TaskForm from "./components/TaskForm";
import SessionModal from "./components/SessionModal";
import SessionTimer from "./components/SessionTimer";
import {
	categories,
	focusModes,
	quickLinks,
	statusOptions,
} from "./data/dashboardData";

export default function App() {
	const [tasks, setTasks] = useState([]);
	const [finishedCount, setFinishedCount] = useState(0);
	const [finishedTasks, setFinishedTasks] = useState([]);
	const [showFinished, setShowFinished] = useState(false);
	const [isFetchingFinished, setIsFetchingFinished] = useState(false);
	const [isClearingFinished, setIsClearingFinished] = useState(false);
	const [activeMode, setActiveMode] = useState(focusModes[0].id);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [finishedError, setFinishedError] = useState(null);
	const [sessionError, setSessionError] = useState(null);
	const [sessionConfig, setSessionConfig] = useState(null);
	const [sessionModal, setSessionModal] = useState({
		isOpen: false,
		modeId: null,
	});
	const [activeSession, setActiveSession] = useState(null);
	const [formState, setFormState] = useState({
		label: "",
		category: categories[0],
		status: statusOptions[0],
	});

	useEffect(() => {
		let cancelled = false;

		const bootstrap = async () => {
			try {
				if (window.dashboard?.sessions?.getConfig) {
					const config = await window.dashboard.sessions.getConfig();
					if (!cancelled) {
						setSessionConfig(config);
					}
				}
			} catch (configError) {
				console.error(
					"Failed to load session configuration",
					configError
				);
			}

			if (!window.dashboard?.tasks?.list) {
				setIsLoading(false);
				return;
			}

			try {
				const [active, finished] = await Promise.all([
					window.dashboard.tasks.list(),
					window.dashboard.tasks.listFinished(),
				]);

				if (!cancelled) {
					setTasks(Array.isArray(active) ? active : []);
					setFinishedCount(
						Array.isArray(finished) ? finished.length : 0
					);
				}
			} catch (bootstrapError) {
				console.error("Failed to load tasks", bootstrapError);
				if (!cancelled) {
					setError("Kan taken niet laden. Probeer het opnieuw.");
					setTasks([]);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		bootstrap();

		return () => {
			cancelled = true;
		};
	}, []);

	const handleFormChange = (event) => {
		const { name, value } = event.target;
		setFormState((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleAddTask = async (event) => {
		event.preventDefault();
		if (!formState.label.trim()) {
			return;
		}

		const payload = {
			label: formState.label.trim(),
			category: formState.category,
			status: formState.status,
		};

		setIsSubmitting(true);
		setError(null);
		try {
			if (window.dashboard?.tasks?.add) {
				const response = await window.dashboard.tasks.add(payload);
				setTasks(response.tasks ?? []);
			} else {
				setTasks((prev) => [
					...prev,
					{
						id: prev.length + 1,
						...payload,
					},
				]);
			}
			setFormState({
				label: "",
				category: categories[0],
				status: statusOptions[0],
			});
		} catch (addError) {
			console.error("Failed to add task", addError);
			setError("Kan taak niet toevoegen. Probeer het opnieuw.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleStatusChange = async (id, status) => {
		try {
			if (window.dashboard?.tasks?.updateStatus) {
				const response = await window.dashboard.tasks.updateStatus(
					id,
					status
				);
				setTasks(response.tasks ?? []);
			} else {
				setTasks((prev) =>
					prev.map((task) =>
						task.id === id ? { ...task, status } : task
					)
				);
			}
		} catch (statusError) {
			console.error("Failed to update task status", statusError);
			setError("Status bijwerken mislukt.");
		}
	};

	const handleClearFinishedTasks = async () => {
		if (!showFinished) {
			return;
		}

		if (!window.dashboard?.tasks?.clearFinished) {
			setFinishedTasks([]);
			setFinishedCount(0);
			return;
		}

		setIsClearingFinished(true);
		setFinishedError(null);
		try {
			await window.dashboard.tasks.clearFinished();
			setFinishedTasks([]);
			setFinishedCount(0);
		} catch (clearError) {
			console.error("Failed to clear finished tasks", clearError);
			setFinishedError("Wissen van afgeronde taken mislukt.");
		} finally {
			setIsClearingFinished(false);
		}
	};

	const handleShowFinishedTasks = async () => {
		if (showFinished) {
			setShowFinished(false);
			return;
		}

		if (!window.dashboard?.tasks?.listFinished) {
			setFinishedTasks([]);
			setShowFinished(true);
			return;
		}

		setIsFetchingFinished(true);
		setFinishedError(null);
		try {
			const finished = await window.dashboard.tasks.listFinished();
			const items = Array.isArray(finished) ? finished : [];
			setFinishedTasks(items);
			setFinishedCount(items.length);
		} catch (finishedLoadError) {
			console.error("Failed to load finished tasks", finishedLoadError);
			setFinishedError("Kon afgeronde taken niet laden.");
			setFinishedTasks([]);
		} finally {
			setIsFetchingFinished(false);
			setShowFinished(true);
		}
	};
	const handleComplete = async (id) => {
		try {
			if (window.dashboard?.tasks?.complete) {
				const response = await window.dashboard.tasks.complete(id);
				setTasks(response.tasks ?? []);
				setFinishedCount(
					response.finishedTasks?.length ?? finishedCount
				);
				setFinishedTasks(response.finishedTasks ?? []);
			} else {
				setTasks((prev) => prev.filter((task) => task.id !== id));
				setFinishedCount((prev) => prev + 1);
			}
		} catch (completeError) {
			console.error("Failed to complete task", completeError);
			setError("Taak voltooien mislukt.");
		}
	};

	const focusModeById = (id) =>
		focusModes.find((mode) => mode.id === id) ?? null;

	const handleStartSession = (modeId) => {
		setActiveMode(modeId);
		setSessionError(null);
		setSessionModal({ isOpen: true, modeId });
	};

	const handleConfirmSession = async (modeId, payload) => {
		const sessionsAPI = window.dashboard?.sessions;
		if (!sessionsAPI) {
			console.warn("Session handling API is not available.");
			return;
		}

		setSessionError(null);

		try {
			let response;

			if (modeId === "study") {
				response = await sessionsAPI.startStudy?.(payload);
			} else if (modeId === "gaming") {
				response = await sessionsAPI.startGaming?.(payload);
			} else if (modeId === "coding") {
				response = await sessionsAPI.startCoding?.(payload);
			} else {
				throw new Error(`Unsupported mode: ${modeId}`);
			}

			setSessionModal({ isOpen: false, modeId: null });

			const modeConfig = sessionConfig?.[modeId];
			const timerMinutes =
				typeof payload?.timerMinutes === "number" &&
				payload.timerMinutes > 0
					? payload.timerMinutes
					: typeof response?.durationMinutes === "number"
					? response.durationMinutes
					: null;

			let alertMinutes = Array.isArray(modeConfig?.alertMinutes)
				? modeConfig.alertMinutes.filter(
						(value) =>
							typeof value === "number" &&
							value >= 0 &&
							(timerMinutes == null || value <= timerMinutes)
				  )
				: [];

			if (timerMinutes != null) {
				alertMinutes = Array.from(new Set([...alertMinutes, 0]))
					.filter((value) => value >= 0 && value <= timerMinutes)
					.sort((a, b) => b - a);
			}

			const modeMeta = focusModeById(modeId);
			setActiveSession({
				modeId,
				modeName: modeMeta?.name ?? modeId,
				startedAt: Date.now(),
				durationMinutes: timerMinutes,
				alertMinutes,
			});
		} catch (sessionStartError) {
			console.error("Failed to start session", sessionStartError);
			setSessionError(
				"Kon sessie niet starten. Controleer de instellingen."
			);
		}
	};

	const handleCloseModal = () => {
		setSessionModal({ isOpen: false, modeId: null });
	};

	const handleStopSession = () => {
		setActiveSession(null);
	};

	return (
		<div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			<header className="border-b border-slate-800 bg-panel/50 px-8 py-6 backdrop-blur">
				<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-sm uppercase tracking-widest text-accent/70">
							Personal Command Center
						</p>
						<h1 className="mt-1 text-3xl font-bold text-white">
							Focus Modes Dashboard
						</h1>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleShowFinishedTasks}
							className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-accent/60 hover:text-accent"
						>
							<span className="text-accent">✓</span>
							<span>{finishedCount} afgeronde taken</span>
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-8 py-10">
				<section>
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-semibold text-white">
							Focus Modes
						</h2>
						<p className="text-sm text-slate-400">
							Pick a mode to set the tone for your next session.
							Actions can trigger apps, scripts, or playlists.
						</p>
					</div>
					{sessionError && (
						<div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
							{sessionError}
						</div>
					)}
					<div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
						{focusModes.map((mode) => (
							<FocusModeCard
								key={mode.id}
								mode={mode}
								isActive={mode.id === activeMode}
								onSelect={() => handleStartSession(mode.id)}
							/>
						))}
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-3">
					<div className="rounded-2xl border border-slate-800 bg-panel/60 p-6 shadow-inner shadow-slate-900/40 lg:col-span-2">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-white">
								Task Planner
							</h2>
							<span className="text-sm text-slate-400">
								Keep track of the sessions tied to each mode.
							</span>
						</div>

						<div className="mt-5 space-y-4">
							<TaskForm
								onSubmit={handleAddTask}
								formState={formState}
								onChange={handleFormChange}
								isSubmitting={isSubmitting}
								categories={categories}
								statusOptions={statusOptions}
							/>
							{error && (
								<div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
									{error}
								</div>
							)}
							{isLoading ? (
								<div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
									Taken worden geladen...
								</div>
							) : tasks.length === 0 ? (
								<div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
									Er staan geen actieve taken klaar. Voeg er
									één toe om te starten.
								</div>
							) : (
								<div className="space-y-4">
									{tasks.map((task) => (
										<div
											key={task.id}
											className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 transition hover:border-accent/50 hover:bg-slate-900/70"
										>
											<div>
												<p className="text-base font-medium text-white">
													{task.label}
												</p>
												<p className="text-xs uppercase tracking-wider text-slate-400">
													{task.category}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<select
													value={task.status}
													onChange={(event) =>
														handleStatusChange(
															task.id,
															event.target.value
														)
													}
													className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-100 outline-none transition hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-accent/30"
												>
													{[
														...statusOptions,
														"Done",
													].map((status) => (
														<option
															key={status}
															value={status}
														>
															{status}
														</option>
													))}
												</select>
												<StatusPill
													status={task.status}
												/>
												<button
													type="button"
													onClick={() =>
														handleComplete(task.id)
													}
													className="rounded-lg border border-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:border-accent hover:bg-accent/10"
												>
													Markeer voltooid
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<div className="rounded-2xl border border-slate-800 bg-panel/60 p-6 shadow-inner shadow-slate-900/40">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-white">
								Quick Links
							</h2>
							<span className="text-sm text-slate-400">
								Launch your favorite tools instantly.
							</span>
						</div>
						<div className="mt-5 grid gap-3">
							{quickLinks.map((link) => (
								<QuickLinkTile key={link.url} link={link} />
							))}
						</div>
					</div>
				</section>
			</main>

			{showFinished && (
				<FinishedTasksPanel
					tasks={finishedTasks}
					onClose={() => setShowFinished(false)}
					onClear={handleClearFinishedTasks}
					isLoading={isFetchingFinished}
					isClearing={isClearingFinished}
					error={finishedError}
				/>
			)}

			{sessionModal.isOpen && (
				<SessionModal
					modeId={sessionModal.modeId}
					mode={focusModeById(sessionModal.modeId)}
					config={sessionConfig?.[sessionModal.modeId]}
					onCancel={handleCloseModal}
					onConfirm={(payload) =>
						handleConfirmSession(sessionModal.modeId, payload)
					}
				/>
			)}

			{activeSession && (
				<SessionTimer
					session={activeSession}
					onClear={handleStopSession}
				/>
			)}
		</div>
	);
}
