import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default {
	command: ".total",
	name: "「 TOTAL FITUR 」",
	description: "Total fitur bot.",
	execute: async (sock, sender, text, msg) => {
		// Pastikan path menuju folder utama yang berisi semua kategori fitur
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const directoryPath = path.resolve(__dirname, "../");

		try {
			// Fungsi rekursif untuk menghitung total file dalam subfolder
			const countFiles = (dir) => {
				let count = 0;
				if (!fs.existsSync(dir)) return 0; // Cek jika folder tidak ada

				const files = fs.readdirSync(dir);
				for (const file of files) {
					const filePath = path.join(dir, file);
					const stat = fs.lstatSync(filePath);

					if (stat.isDirectory()) {
						count += countFiles(filePath); // Rekursif ke dalam folder
					} else if (file !== "Help.js" && file.endsWith(".js")) {
						count++;
					}
				}
				return count;
			};

			// Hitung total fitur dalam folder utama
			const totalFeatures = countFiles(directoryPath);

			// Kirim pesan dengan jumlah fitur
			await sock.sendMessage(
				sender,
				{
					text: `📂 *Total fitur _Bro-Bot_:* ${totalFeatures}`,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(
				sender,
				{ text: "❌ *Terjadi kesalahan saat menghitung fitur!*" },
				{ quoted: msg },
			);
		}
	},
};
