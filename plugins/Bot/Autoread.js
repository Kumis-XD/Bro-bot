import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menggunakan path relatif yang menunjuk ke ../../data/autosholat.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/autoread.json");

// Memuat status AutoSholat dari file
export const loadConfig = () => {
	try {
		// Memeriksa apakah file ada
		if (!fs.existsSync(CONFIG_FILE)) {
			// Jika file tidak ada, buat file baru dengan konfigurasi default
			saveConfig({ autoread: false });
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat konfigurasi:", error);
		return { autoread: false }; // Default konfigurasi jika terjadi error
	}
};

// Menyimpan status AutoSholat ke file
export const saveConfig = (config) => {
	try {
		// Pastikan direktori untuk file sudah ada
		const dir = path.dirname(CONFIG_FILE);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true }); // Membuat direktori jika tidak ada
		}

		// Menyimpan konfigurasi ke file JSON
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan konfigurasi:", error);
	}
};

export default {
	command: ".autoread",
	name: "「 MESSAGE AUTO READ 」",
	description: "Mengaktifkan atau menonaktifkan auto read pesan.",
	execute: async (sock, sender, text, msg) => {
		try {
			let config = loadConfig();
			const statusMatch = text.match(/^.autoread\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah! Gunakan: *.autoread on* atau *.autoread off*",
				});
				return;
			}

			if (status === "on") {
				if (config.autoread) {
					await sock.sendMessage(sender, {
						text: "✅ Auto read sudah aktif!",
					});
				} else {
					config.autoread = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Auto read telah diaktifkan!",
					});
				}
			} else if (status === "off") {
				if (!config.autoread) {
					await sock.sendMessage(sender, {
						text: "✅ Auto read sudah nonaktif!",
					});
				} else {
					config.autoread = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Auto read telah dinonaktifkan!",
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
