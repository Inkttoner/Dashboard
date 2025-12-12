import { useEffect, useMemo, useState } from "react";

function parseWebsites(input) {
	if (!input) {
		return [];
	}

	return input
		.split(/\r?\n|,/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

const MODE_LABELS = {
	study: "Study Session",
	gaming: "Gaming Session",
	coding: "Coding Session",
};

export default function SessionModal({
	modeId,
	mode,
	config,
	onCancel,
	onConfirm,
}) {
	const [selectedDurationId, setSelectedDurationId] = useState(null);
	const [customDuration, setCustomDuration] = useState("");
	const [selectedGameId, setSelectedGameId] = useState(null);
	const [selectedIdeId, setSelectedIdeId] = useState(null);
	const [websitesText, setWebsitesText] = useState("");
	const [timerMinutes, setTimerMinutes] = useState("");

	const defaultTimerMinutes = useMemo(() => {
		if (!config) {
			return null;
		}

		if (typeof config.defaultTimerMinutes === "number") {
			return config.defaultTimerMinutes;
		}

		if (modeId === "study" && config.durationOptions?.[0]?.minutes) {
			return config.durationOptions[0].minutes;
		}

		return modeId === "coding" ? 90 : 60;
	}, [config, modeId]);

	useEffect(() => {
		if (!config) {
			return;
		}

		setCustomDuration("");
		setWebsitesText("");
		setTimerMinutes(defaultTimerMinutes ?? "");

		if (modeId === "study") {
			setSelectedDurationId(config.durationOptions?.[0]?.id ?? null);
		} else if (modeId === "gaming") {
			setSelectedGameId(config.games?.[0]?.id ?? null);
		} else if (modeId === "coding") {
			setSelectedIdeId(config.ides?.[0]?.id ?? null);
		}
	}, [config, modeId, defaultTimerMinutes]);

	if (!modeId || !config) {
		return null;
	}

	const resolvedModeName = mode?.name ?? MODE_LABELS[modeId] ?? "Session";

	const numericTimer =
		timerMinutes === "" ? null : Math.max(Number(timerMinutes), 1);

	const canSubmit =
		modeId === "study"
			? (customDuration && Number(customDuration) > 0) || selectedDurationId
			: modeId === "gaming"
			? Boolean(selectedGameId)
			: modeId === "coding"
			? Boolean(selectedIdeId)
			: false;

	const handleSubmit = () => {
		if (!canSubmit) {
			return;
		}

		const payload = {};

		if (modeId === "study") {
			if (customDuration) {
				payload.durationMinutes = Number(customDuration);
			} else {
				payload.durationId = selectedDurationId;
				const matched = config.durationOptions?.find(
					(option) => option.id === selectedDurationId
				);
				if (!numericTimer && matched?.minutes) {
					payload.timerMinutes = matched.minutes;
				}
			}
		} else if (modeId === "gaming") {
			payload.gameId = selectedGameId;
			payload.websites = parseWebsites(websitesText);
		} else if (modeId === "coding") {
			payload.ideId = selectedIdeId;
			payload.websites = parseWebsites(websitesText);
		}

		if (numericTimer) {
			payload.timerMinutes = numericTimer;
		}

		onConfirm?.(payload);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
			<div className="mx-4 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-accent/20">
				<header className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-accent/70">
							Session Setup
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							{resolvedModeName}
						</h2>
						<p className="mt-2 text-sm text-slate-300">{config.message}</p>
					</div>
					<button
						type="button"
						onClick={onCancel}
						className="rounded-full border border-slate-700 p-2 text-slate-300 transition hover:border-accent/60 hover:text-accent"
						aria-label="Close session modal"
					>
						&times;
					</button>
				</header>

				<div className="mt-6 space-y-6">
					{modeId === "study" && (
						<section>
							<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
								Select duration
							</h3>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								{config.durationOptions?.map((option) => (
									<label
										key={option.id}
										className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition ${
											option.id === selectedDurationId
												? "border-accent bg-accent/10"
												: "border-slate-800 bg-slate-900/70 hover:border-accent/50"
										}`}
									>
										<div>
											<p className="text-sm font-medium text-white">
												{option.label}
											</p>
											<p className="text-xs text-slate-400">
												{option.minutes} minutes
											</p>
										</div>
										<input
											type="radio"
											name="study-duration"
											checked={option.id === selectedDurationId}
											onChange={() => {
												setSelectedDurationId(option.id);
												setCustomDuration("");
												if (!numericTimer && option.minutes) {
													setTimerMinutes(option.minutes);
												}
											}}
											className="h-4 w-4 accent-accent"
										/>
									</label>
								))}
							</div>
							<div className="mt-4">
								<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
									Custom duration (minutes)
								</label>
								<input
									type="number"
									min="5"
									step="5"
									placeholder="E.g. 50"
									value={customDuration}
									onChange={(event) => {
										setCustomDuration(event.target.value);
										if (event.target.value) {
											setSelectedDurationId(null);
										}
									}}
									className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
								/>
							</div>
						</section>
					)}

					{modeId === "gaming" && (
						<section className="space-y-4">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
									Choose your game
								</label>
								<select
									value={selectedGameId ?? ""}
									onChange={(event) =>
										setSelectedGameId(event.target.value || null)
									}
									className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
								>
									{config.games?.map((game) => (
										<option key={game.id} value={game.id}>
											{game.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
									Websites to open (one per line)
								</label>
								<textarea
									rows={3}
									placeholder="https://tracker.gg&#10;https://discord.com/app"
									value={websitesText}
									onChange={(event) => setWebsitesText(event.target.value)}
									className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
								/>
								<p className="mt-1 text-xs text-slate-500">
									We&apos;ll open these alongside your game.
								</p>
							</div>
						</section>
					)}

					{modeId === "coding" && (
						<section className="space-y-4">
							<div>
								<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
									Choose your IDE
								</label>
								<select
									value={selectedIdeId ?? ""}
									onChange={(event) =>
										setSelectedIdeId(event.target.value || null)
									}
									className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
								>
									{config.ides?.map((ide) => (
										<option key={ide.id} value={ide.id}>
											{ide.label}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
									Extra sites to open (optional)
								</label>
								<textarea
									rows={3}
									placeholder="https://github.com/Coen/my-project"
									value={websitesText}
									onChange={(event) => setWebsitesText(event.target.value)}
									className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
								/>
							</div>
						</section>
					)}

					<section>
						<label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
							Timer (minutes)
						</label>
						<input
							type="number"
							min="1"
							value={timerMinutes ?? ""}
							onChange={(event) => setTimerMinutes(event.target.value)}
							className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
						/>
						<p className="mt-1 text-xs text-slate-500">
							We&apos;ll start a countdown when the session begins.
						</p>
					</section>
				</div>

				<footer className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={handleSubmit}
						className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Start Session
					</button>
				</footer>
			</div>
		</div>
	);
}

