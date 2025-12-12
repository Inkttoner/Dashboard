export default function FinishedTasksPanel({
	tasks,
	onClose,
	onClear,
	isLoading,
	isClearing,
	error,
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur">
			<div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-panel/90 p-6 shadow-2xl shadow-slate-950/50">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-2xl font-semibold text-white">Afgeronde taken</h2>
						<p className="mt-1 text-sm text-slate-400">
							Dit is je archief van voltooide sessies. Je kunt het archief leegmaken wanneer je klaar bent.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							disabled={isClearing}
							onClick={onClear}
							className="rounded-lg border border-danger/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-danger transition hover:border-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-70"
						>
							Archief wissen
						</button>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-400 hover:text-white"
						>
							Sluiten
						</button>
					</div>
				</div>

				{error && (
					<div className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
				)}

				<div className="mt-5 max-h-[26rem] overflow-y-auto pr-2">
					{isLoading ? (
						<div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
							Afgeronde taken worden geladen...
						</div>
					) : tasks.length === 0 ? (
						<div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
							Nog geen afgeronde taken. Je voltooide items verschijnen hier.
						</div>
					) : (
						<ul className="space-y-3">
							{tasks.map((task) => (
								<li key={task.id} className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-base font-medium text-white">{task.label}</p>
											<p className="text-xs uppercase tracking-wider text-slate-400">
												{task.category || "Onbekend"}
											</p>
										</div>
										<div className="text-right text-xs text-slate-400">
											<p>Voltooid</p>
											<p className="font-semibold text-slate-200">
												{task.completedAt ? new Date(task.completedAt).toLocaleString() : "Onbekend"}
											</p>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}

