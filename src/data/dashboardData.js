export const focusModes = [
	{
		id: "study",
		name: "Study Session",
		description:
			"Time to start a study session choose a topic and start studying",
		gradient: "from-blue-500 to-cyan-500",
		actions: [
			"Open Spotify",
			"Start Timer",
			"Open Obsidian",
			"Open Browser",
		],
	},
	{
		id: "gaming",
		name: "Gaming",
		description:
			"Time to start a gaming session choose a game and start playing",
		gradient: "from-purple-500 to-fuchsia-500",
		actions: ["Launch Steam", "Enable Stream Deck", "Toggle FPS Overlay"],
	},
	{
		id: "coding",
		name: "Coding Session",
		description:
			"Time to start a coding session choose a project and start coding",
		gradient: "from-emerald-500 to-teal-500",
		actions: ["Open VS Code", "Open Terminal", "Open Browser"],
	},
];

export const quickLinks = [
	{ label: "Gmail", url: "https://mail.google.com", icon: "📧" },
	{ label: "Notion", url: "https://notion.so", icon: "🧠" },
	{
		label: "YouTube Study",
		url: "https://www.youtube.com/results?search_query=study+with+me",
		icon: "🎧",
	},
	{ label: "Calendar", url: "https://calendar.google.com", icon: "🗓️" },
	{ label: "Pomofocus", url: "https://pomofocus.io", icon: "⏱️" },
	{ label: "DeepL", url: "https://deepl.com", icon: "📝" },
];

export const categories = [
	"Study",
	"Creative",
	"Recharge",
	"Gaming",
	"General",
];
export const statusOptions = ["Planned", "In progress"];
