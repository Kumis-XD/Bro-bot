import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import pkg from 'file-type';
const { fromBuffer } = pkg;

const catbox = async (buffer) => {
	try {
		let { ext } = await fromBuffer(buffer);
		let form = new FormData();
		form.append("fileToUpload", buffer, "file." + ext);
		form.append("reqtype", "fileupload");

		let { data } = await axios.post(
			"https://catbox.moe/user/api.php",
			form,
			{
				headers: { ...form.getHeaders() },
			},
		);

		return data.startsWith("https://") ? data : null; // Validasi URL
	} catch (error) {
		console.error("❌ Error upload ke Catbox:", error);
		return null;
	}
};

export default {
	command: ".tourl",
	name: "「 IMAGE TO URL 」",
	description: "Convert gambar menjadi URL.",
	execute: async (sock, sender, text, msg, quotd) => {
		try {
			if (!quotd)
				return await sock.sendMessage(
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

			// Download media
			let media = await sock.downloadMediaMessage(quotd);
			if (!media)
				return await sock.sendMessage(
					sender,
					{ text: "❌ *Gagal mendownload media!*" },
					{ quoted: msg },
				);

			// Upload ke Catbox
			let fileUrl = await catbox(media);
			if (!fileUrl)
				return await sock.sendMessage(
					sender,
					{ text: "❌ *Gagal mengunggah ke Catbox!*" },
					{ quoted: msg },
				);

			// Kirim URL hasil upload
			await sock.sendMessage(
				sender,
				{
					image: { url: fileUrl },
					caption: `✅ *File berhasil diunggah!*\n📎 *URL:* ${fileUrl}`,
				},
				{ quoted: msg },
			);
		} catch (err) {
			console.error("❌ Error:", err);
			await sock.sendMessage(
				sender,
				{
					text: "❌ *Terjadi kesalahan saat upload! Coba lagi nanti.*",
				},
				{ quoted: msg },
			);
		}
	},
};
