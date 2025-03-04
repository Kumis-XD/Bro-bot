import fs from "fs";
import axios from "axios";
import path from "path"; // Import path module untuk penanganan path file sementara
import { fileURLToPath } from "url"; // Untuk mengonversi URL file menjadi path
import FormData from "form-data"; // Import form-data dengan benar

export default {
	command: ".tourl",
	name: "「 IMAGE TO URL 」",
	description: "Convert gambar menjadi url.",
	execute: async (sock, sender, text, msg, quotd) => {
		if (!quotd)
			return sock.sendMessage(
				sender,
				{ text: "❌ *Reply file atau gambar yang mau di-upload!*" },
				{ quoted: msg },
			);

		let q = msg.quoted ? msg.quoted : msg;
		let mime = (q.msg || quotd).mimetype || "";
		if (!/image|video|audio|document/.test(mime))
			return await sock.sendMessage(
				sender,
				{ text: "❌ *Format file tidak didukung!*" },
				{ quoted: msg },
			);

		// Download media dan simpan ke file sementara
		let media = await sock.downloadMediaMessage(quotd);

		// Menggunakan import.meta.url untuk mendapatkan path direktori saat ini
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		const tempFilePath = path.join(__dirname, `tempfile_${Date.now()}.jpg`);

		// Simpan file media ke path sementara
		fs.writeFileSync(tempFilePath, media);

		// Upload ke server
		let form = new FormData();
		form.append("file", fs.createReadStream(tempFilePath));

		try {
			// Pastikan untuk menambahkan headers pada request
			let { data } = await axios.post(
				"https://cloudkuimages.xyz/upload",
				form,
				{
					headers: {
						...form.getHeaders(),
					},
				},
			);

			if (data.status === "success") {
				await sock.sendMessage(
					sender,
					{
						image: { url: data.file_url },
						caption: `✅ *File berhasil diunggah!*\n📎 *URL:* ${data.file_url}`,
					},
					{ quoted: msg },
				);
			} else {
				await sock.sendMessage(
					sender,
					{ text: `❌ *Gagal upload!* ${data.message}` },
					{ quoted: msg },
				);
			}
		} catch (err) {
			console.error("❌ Error upload:", err);
			await sock.sendMessage(
				sender,
				{
					text: "❌ *Terjadi kesalahan saat upload! Coba lagi nanti.*",
				},
				{ quoted: msg },
			);
		}

		// Hapus file sementara setelah upload
		fs.unlinkSync(tempFilePath);
	},
};
