import { useMemo } from "react";

export default function StatusPill({ status }) {
	const color = useMemo(() => {
		switch (status) {
			case "Done":
				return "bg-success/20 text-success";
			case "In progress":
				return "bg-accent/20 text-accent";
			default:
				return "bg-warning/20 text-warning";
		}
	}, [status]);

	return (
		<span className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${color}`}>
			{status}
		</span>
	);
}

