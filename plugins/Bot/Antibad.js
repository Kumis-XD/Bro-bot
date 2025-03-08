import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Menentukan path file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, "../../data/antibad.json");
const WARNINGS_FILE = path.resolve(__dirname, "../../data/warnings.json");

// **Muat atau perbarui daftar kata kasar dari URL eksternal**
const fetchBadWords = async () => {
	try {
		const { data } = await axios.get(
			"https://raw.githubusercontent.com/drizki/indonesian-badwords/refs/heads/main/src/dict.json",
		);
		return data; // Mengembalikan daftar kata kasar dalam bentuk array
	} catch (error) {
		console.error("❌ Error saat mengambil daftar kata kasar:", error);
		return [];
	}
};

// Muat status AntiBad dari file
export const loadAntibad = () => {
	try {
		if (!fs.existsSync(CONFIG_FILE)) {
			saveAntibad({});
		}
		return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat konfigurasi AntiBad:", error);
		return {};
	}
};

// Simpan status AntiBad ke file
export const saveAntibad = (config) => {
	try {
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan konfigurasi AntiBad:", error);
	}
};

// Muat data peringatan dari file
export const loadWarnings = () => {
	try {
		if (!fs.existsSync(WARNINGS_FILE)) {
			fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}));
		}
		return JSON.parse(fs.readFileSync(WARNINGS_FILE, "utf-8"));
	} catch (error) {
		console.error("❌ Error saat memuat data peringatan:", error);
		return {};
	}
};

// Simpan data peringatan ke file
export const saveWarnings = (warnings) => {
	try {
		fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
	} catch (error) {
		console.error("❌ Error saat menyimpan data peringatan:", error);
	}
};

// **Cek apakah teks mengandung kata kasar**
export const containsBadWord = async (text) => {
	const badWords = await fetchBadWords();
	return badWords.some((word) => text.includes(word));
};

export default {
	command: ".antibad",
	name: "「 ANTI BADWORD 」",
	description:
		"Mengaktifkan atau menonaktifkan pemblokiran kata kasar di grup.",
	execute: async (sock, sender, text, msg) => {
		try {
			const isGroup = msg.key.remoteJid.endsWith("@g.us"); // Cek apakah dalam grup
			if (!isGroup) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Perintah ini hanya bisa digunakan dalam grup!",
				});
			}

			// Ambil informasi grup
			const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
			const groupMembers = groupMetadata.participants || [];
			const groupAdmins = groupMembers
				.filter((member) => member.admin)
				.map((member) => member.id);
			const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

			// **Cek apakah bot adalah admin**
			const isBotAdmin = groupAdmins.includes(botNumber);
			if (!isBotAdmin) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Bot harus menjadi admin untuk menggunakan fitur ini!",
				});
			}

			// **Ambil status perintah (on/off)**
			const statusMatch = text.match(/^\.antibad\s+(\S+)/);
			const status = statusMatch ? statusMatch[1] : null;

			if (!status || (status !== "on" && status !== "off")) {
				return await sock.sendMessage(sender, {
					text: "⚠️ Format salah!\nGunakan: *.antibad on* atau *.antibad off*",
				});
			}

			// **Ambil dan update konfigurasi**
			let config = loadAntibad();

			if (!config[sender]) {
				config[sender] = false;
			}

			if (status === "on") {
				if (config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-Badword sudah aktif di grup ini!",
					});
				} else {
					config[sender] = true;
					saveAntibad(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-Badword telah diaktifkan! Semua kata kasar akan otomatis diberikan peringatan.",
					});
				}
			} else if (status === "off") {
				if (!config[sender]) {
					await sock.sendMessage(sender, {
						text: "✅ Anti-Badword sudah nonaktif di grup ini!",
					});
				} else {
					config[sender] = false;
					saveAntibad(config);
					await sock.sendMessage(sender, {
						text: "✅ Anti-Badword telah dinonaktifkan!",
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
