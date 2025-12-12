export default function FocusModeCard({ mode, isActive, onSelect }) {
	return (
		<button
			type="button"
			onClick={() => onSelect(mode.id)}
			className={`rounded-2xl border border-slate-700 bg-panel/40 p-5 text-left transition hover:border-accent/60 hover:shadow-lg hover:shadow-accent/20 ${
				isActive ? "border-accent shadow-lg shadow-accent/20" : ""
			}`}
		>
			<div
				className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mode.gradient} text-2xl`}
			>
				{mode.name.charAt(0)}
			</div>
			<div className="mt-4 space-y-2">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-white">
						{mode.name}
					</h3>
					{isActive && (
						<span className="text-xs font-semibold text-accent">
							ACTIVE
						</span>
					)}
				</div>
				<p className="text-sm text-slate-300">{mode.description}</p>
			</div>
			<ul className="mt-4 space-y-2 text-sm text-slate-200">
				{mode.actions.map((action) => (
					<li key={action} className="flex items-center gap-2">
						<span className="text-accent">•</span>
						{action}
					</li>
				))}
			</ul>
		</button>
	);
}
