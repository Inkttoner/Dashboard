import { useEffect, useMemo, useRef, useState } from "react";

function formatDuration(ms) {
	const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
	const minutes = Math.floor(totalSeconds / 60)
		.toString()
		.padStart(2, "0");
	const seconds = (totalSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${seconds}`;
}

function formatElapsed(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

export default function SessionTimer({ session, onClear }) {
	const [now, setNow] = useState(Date.now());
	const triggeredAlertsRef = useRef(new Set());

	useEffect(() => {
		const intervalId = setInterval(() => {
			setNow(Date.now());
		}, 1000);
		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		triggeredAlertsRef.current = new Set();
	}, [session.modeId, session.startedAt]);

	const timing = useMemo(() => {
		const elapsed = now - session.startedAt;
		const durationMs =
			typeof session.durationMinutes === "number"
				? session.durationMinutes * 60 * 1000
				: null;
		const remaining =
			durationMs != null ? Math.max(durationMs - elapsed, 0) : null;
		const isFinished = durationMs != null && remaining === 0;

		return { elapsed, remaining, isFinished };
	}, [now, session.durationMinutes, session.startedAt]);

	const alertThresholds = useMemo(() => {
		if (!Array.isArray(session.alertMinutes)) {
			return [];
		}

		return session.alertMinutes
			.filter((value) => typeof value === "number" && value >= 0)
			.sort((a, b) => b - a);
	}, [session.alertMinutes]);

	// Handle alerts/notifications when timer reaches thresholds
	// NOTE: This does NOT automatically stop the session or close apps
	// Apps only close when user manually clicks the "Stop" button
	useEffect(() => {
		if (timing.remaining == null || alertThresholds.length === 0) {
			return;
		}

		const remainingMinutes = timing.remaining / (60 * 1000);

		alertThresholds.forEach((thresholdMinutes) => {
			if (triggeredAlertsRef.current.has(thresholdMinutes)) {
				return;
			}

			if (remainingMinutes <= thresholdMinutes) {
				triggeredAlertsRef.current.add(thresholdMinutes);

				const message =
					thresholdMinutes > 0
						? `${thresholdMinutes} minute${
								thresholdMinutes === 1 ? "" : "s"
						  } remaining in your ${session.modeName}.`
						: `Time is up for your ${session.modeName}.`;

				const title =
					thresholdMinutes > 0
						? `${session.modeName}: ${thresholdMinutes} min left`
						: `${session.modeName}: Timer finished`;

				if (typeof window !== "undefined" && "Notification" in window) {
					try {
						if (Notification.permission === "granted") {
							new Notification(title, { body: message });
						} else if (Notification.permission !== "denied") {
							Notification.requestPermission().then(
								(permission) => {
									if (permission === "granted") {
										new Notification(title, {
											body: message,
										});
									}
								}
							);
						} else {
							window.alert?.(message);
						}
					} catch (notificationError) {
						console.error(
							"Failed to show notification",
							notificationError
						);
						window.alert?.(message);
					}
				} else if (typeof window !== "undefined") {
					window.alert?.(message);
				}
			}
		});
	}, [alertThresholds, session.modeName, timing.remaining]);

	return (
		<div className="fixed right-6 top-6 z-40 max-w-xs rounded-2xl border border-accent/40 bg-slate-900/90 p-4 shadow-lg shadow-accent/30 backdrop-blur">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.35em] text-accent/70">
						Active Session
					</p>
					<h3 className="mt-1 text-lg font-semibold text-white">
						{session.modeName ?? "Session"}
					</h3>
				</div>
				<button
					type="button"
					onClick={onClear}
					className="rounded-lg border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent transition hover:border-accent/50 hover:bg-accent/10"
					aria-label="Stop session and close launched apps"
				>
					Stop
				</button>
			</div>

			<div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-center">
				{timing.remaining != null ? (
					<>
						<p
							className={`text-3xl font-semibold ${
								timing.isFinished ? "text-danger" : "text-white"
							}`}
						>
							{formatDuration(timing.remaining)}
						</p>
						<p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
							Remaining
						</p>
					</>
				) : (
					<>
						<p className="text-3xl font-semibold text-white">
							{formatElapsed(timing.elapsed)}
						</p>
						<p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
							Elapsed
						</p>
					</>
				)}
			</div>
		</div>
	);
}
