export default function TaskForm({
	onSubmit,
	formState,
	onChange,
	isSubmitting,
	categories,
	statusOptions,
}) {
	return (
		<form
			onSubmit={onSubmit}
			className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-[2fr,1fr,auto]"
		>
			<div className="flex flex-col gap-2">
				<label
					htmlFor="task-label"
					className="text-xs uppercase tracking-wider text-slate-400"
				>
					Task
				</label>
				<input
					id="task-label"
					name="label"
					value={formState.label}
					onChange={onChange}
					placeholder="What do you need to get done?"
					className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/30"
					required
				/>
			</div>
			<div className="flex flex-col gap-2">
				<label
					htmlFor="task-category"
					className="text-xs uppercase tracking-wider text-slate-400"
				>
					Category
				</label>
				<select
					id="task-category"
					name="category"
					value={formState.category}
					onChange={onChange}
					className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/30"
				>
					{categories.map((category) => (
						<option key={category} value={category}>
							{category}
						</option>
					))}
				</select>
			</div>
			<div className="flex flex-col gap-2">
				<label
					htmlFor="task-status"
					className="text-xs uppercase tracking-wider text-slate-400"
				>
					Status
				</label>
				<select
					id="task-status"
					name="status"
					value={formState.status}
					onChange={onChange}
					className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/30"
				>
					{statusOptions.map((status) => (
						<option key={status} value={status}>
							{status}
						</option>
					))}
				</select>
			</div>
			<div className="flex items-end">
				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
				>
					Add Task
				</button>
			</div>
		</form>
	);
}
