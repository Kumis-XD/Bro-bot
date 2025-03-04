import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Path untuk menyimpan status AutoAI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/autoai.json");

// Memuat status AutoAI dari file
export const loadAutoAI = () => {
	try {
		if (!fs.existsSync(CONFIG_FILE)) {
			saveConfig({ autoai: false }); // Default AutoAI mati
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat konfigurasi:", error);
		return { autoai: false };
	}
};

// Menyimpan status AutoAI ke file
export const saveConfig = (config) => {
	try {
		const dir = path.dirname(CONFIG_FILE);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan konfigurasi:", error);
	}
};

export default {
	command: ".autoai",
	name: "「 AUTO AI 」",
	description: "Mengaktifkan atau menonaktifkan AI otomatis.",
	execute: async (sock, sender, text, msg) => {
		try {
			let config = loadAutoAI();
			const statusMatch = text.match(/^\.autoai\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah! Gunakan: *.autoai on* atau *.autoai off*",
				});
				return;
			}

			if (status === "on") {
				if (config.autoai) {
					await sock.sendMessage(sender, {
						text: "✅ AutoAI sudah aktif!",
					});
				} else {
					config.autoai = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ AutoAI telah diaktifkan!",
					});
				}
			} else if (status === "off") {
				if (!config.autoai) {
					await sock.sendMessage(sender, {
						text: "✅ AutoAI sudah nonaktif!",
					});
				} else {
					config.autoai = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ AutoAI telah dinonaktifkan!",
					});
				}
			}
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};
