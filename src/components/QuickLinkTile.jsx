export default function QuickLinkTile({ link }) {
	const handleClick = () => {
		if (window.dashboard?.openLink) {
			window.dashboard.openLink(link.url);
		} else {
			window.open(link.url, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="group flex items-center justify-between rounded-xl border border-slate-700 bg-panel/40 p-4 text-left transition hover:border-accent/60 hover:bg-panel/70"
		>
			<div className="flex items-center gap-3">
				<span className="text-xl">{link.icon}</span>
				<span className="font-medium text-white group-hover:text-accent">{link.label}</span>
			</div>
			<span className="text-xs uppercase tracking-wider text-slate-400 group-hover:text-accent">
				Open
			</span>
		</button>
	);
}

