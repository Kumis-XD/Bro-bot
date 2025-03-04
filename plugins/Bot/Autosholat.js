import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

// Menggunakan path relatif yang menunjuk ke ../../data/autosholat.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../data/autosholat.json');

// Memuat status AutoSholat dari file
export const loadSholat = () => {
  try {
    // Memeriksa apakah file ada
    if (!fs.existsSync(CONFIG_FILE)) {
      // Jika file tidak ada, buat file baru dengan konfigurasi default
      saveConfig({ autosholat: false });
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (error) {
    console.error('❌ Error saat memuat konfigurasi:', error);
    return { autosholat: false }; // Default konfigurasi jika terjadi error
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
    console.error('❌ Error saat menyimpan konfigurasi:', error);
  }
};

export default {
	command: ".autosholat",
	name: "「 AUTO SHOLAT 」",
	description: "Mengaktifkan atau menonaktifkan pengingat sholat otomatis.",
	execute: async (sock, sender, text, msg) => {
		try {
			let config = loadSholat();
			const statusMatch = text.match(/^\.autosholat\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			// Validasi format perintah
			if (!status || (status !== "on" && status !== "off")) {
				await sock.sendMessage(sender, {
					text: "⚠️ Format salah! Gunakan: *.autosholat on* atau *.autosholat off*",
				});
				return;
			}

			// Aktifkan AutoSholat
			if (status === "on") {
				if (config.autosholat) {
					await sock.sendMessage(sender, {
						text: "✅ Auto sholat sudah aktif!",
					});
				} else {
					config.autosholat = true;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Auto sholat telah diaktifkan!",
					});
				}
			}
			// Nonaktifkan AutoSholat
			else if (status === "off") {
				if (!config.autosholat) {
					await sock.sendMessage(sender, {
						text: "✅ Auto sholat sudah nonaktif!",
					});
				} else {
					config.autosholat = false;
					saveConfig(config);
					await sock.sendMessage(sender, {
						text: "✅ Auto sholat telah dinonaktifkan!",
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
