import axios from "axios";
import fs from "fs";
import { exec } from "child_process"; // Jalankan ffmpeg

export default {
	command: ".brat",
	name: "「 BRAT MAKER 」",
	description: "Transcript video dari YouTube.",
	execute: async (sock, sender, text, msg) => {
		// Gunakan regex untuk mengambil URL setelah perintah
		const textMatch = text.match(/^.brat\s+(.+)/);
		const textnya = textMatch ? textMatch[1] : null;

		if (!textnya) {
			await sock.sendMessage(sender, {
				text: "❌ Harap masukkan teks setelah perintah .brat",
			});
			return;
		}

		try {
			// Mengakses API dengan teks
			const url = `https://api.ryzendesu.vip/api/image/brat?text=${encodeURIComponent(
				textnya,
			)}`;
			const response = await axios.get(url, {
				responseType: "arraybuffer",
			});

			// Simpan gambar sementara
			const tempImagePath = "./tempImage.png";
			const tempStickerPath = "./tempSticker.webp";
			fs.writeFileSync(tempImagePath, Buffer.from(response.data));

			// Konversi ke WebP menggunakan FFmpeg
			await new Promise((resolve, reject) => {
				exec(
					`ffmpeg -i ${tempImagePath} -vf "scale=512:512:force_original_aspect_ratio=decrease" -q:v 50 ${tempStickerPath}`,
					(err) => {
						if (err) reject(err);
						else resolve();
					},
				);
			});

			// Kirim sticker
			const stickerBuffer = fs.readFileSync(tempStickerPath);
			await sock.sendMessage(
				sender,
				{
					sticker: stickerBuffer,
				},
				{ quoted: msg },
			);

			// Hapus file sementara
			fs.unlinkSync(tempImagePath);
			fs.unlinkSync(tempStickerPath);
		} catch (error) {
			console.error("Terjadi kesalahan saat mengambil gambar:", error);
			await sock.sendMessage(sender, {
				text: "❌ Terjadi kesalahan saat mengambil gambar.",
			});
		}
	},
};
