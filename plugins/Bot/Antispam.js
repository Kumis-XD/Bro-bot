import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path file penyimpanan konfigurasi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/antispam.json");

// Memuat status AntiSpam dari file JSON
export const loadAntispam = () => {
	try {
		if (!fs.existsSync(CONFIG_FILE)) {
			saveConfig({ antispam: false }); // Buat file jika belum ada
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat konfigurasi:", error);
		return { antispam: false };
	}
};

// Menyimpan status AntiSpam ke file JSON
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
	command: ".antispam",
	name: "「 ANTI SPAM 」",
	description: "Mengaktifkan atau menonaktifkan fitur anti-spam.",
	execute: async (sock, sender, text, msg) => {
		try {
			let config = loadAntispam();
			const statusMatch = text.match(/^\.antispam\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			let groupId = sender.includes("@g.us");

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah! Gunakan: *.antispam on* atau *.antispam off*",
				});
				return;
			}

			if (!groupId) {
				await sock.sendMessage(sender, {
					text: "⚠️ Perintah ini hanya bisa digunakan dalam grup!",
				});
				return;
			}

			if (status === "on") {
				if (config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-spam sudah aktif!",
					});
				} else {
					config[sender] = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-spam telah diaktifkan!",
					});
				}
			} else if (status === "off") {
				if (!config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-spam sudah nonaktif!",
					});
				} else {
					config[sender] = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-spam telah dinonaktifkan!",
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
