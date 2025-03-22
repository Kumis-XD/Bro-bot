import prompts from "prompts";
import { spawn } from "child_process";
import gradient from "gradient-string";
import boxen from "boxen";
import cfonts from "cfonts";
import chalk from "chalk";
import ora from "ora";
import logSymbols from "log-symbols";

async function banner() {
	console.clear();
	cfonts.say("BRO-BOT", {
		font: "block",
		align: "center",
		colors: ["cyan", "blue"],
		background: "black",
		letterSpacing: 1,
		lineHeight: 1,
		space: true,
		gradient: ["red", "yellow"],
		independentGradient: true,
		transitionGradient: true,
	});
}

(async () => {
	banner();

	const spinner = ora({
		text: chalk.yellow("Menunggu pemilihan script..."),
		spinner: "dots",
	}).start();

	const response = await prompts({
		type: "select",
		name: "script",
		message: chalk.cyan("Pilih script yang ingin dijalankan:"),
		choices: [
			{ title: chalk.green("Bot WhatsApp (bot.js)"), value: "bot.js" },
			{ title: chalk.blue("Bot Telegram (tele.js)"), value: "tele.js" },
			{
				title: chalk.magenta("Bot Discord (discord.js)"),
				value: "discord.js",
			},
		],
	});

	spinner.stop();

	if (!response.script) {
		console.log(
			logSymbols.warning,
			chalk.yellow("Tidak ada pilihan yang dipilih. Keluar..."),
		);
		process.exit(0);
	}

	console.log(
		logSymbols.info,
		chalk.cyan(`Menjalankan ${response.script}...\n`),
	);

	const child = spawn("node", [response.script], { stdio: "inherit" });

	child.on("exit", (code) => {
		if (code === 0) {
			console.log(
				logSymbols.success,
				chalk.green(`Proses ${response.script} selesai dengan sukses!`),
			);
		} else {
			console.log(
				logSymbols.error,
				chalk.red(
					`Proses ${response.script} gagal dengan kode keluar: ${code}`,
				),
			);
		}
	});

	child.on("error", (err) => {
		console.log(
			logSymbols.error,
			chalk.red(`Terjadi kesalahan saat menjalankan ${response.script}:`),
			err,
		);
	});
})();
