import axios from "axios";
import dotenv from "dotenv";

// Memuat konfigurasi dari file .env
dotenv.config();

export default {
	command: ".llama",
	name: "「 LLAMA AI 」",
	description: "Menampilkan jawaban AI dari Llama.js",
	execute: async (sock, sender, text, msg) => {
		try {
			const userInput = typeof text === "string" ? text.trim() : "";

			if (!userInput) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan pertanyaan setelah perintah .llama",
				});
			}

			// Mengirim permintaan ke API Llama.js
			const { data } = await axios.get(
				`https://api.siputzx.my.id/api/ai/luminai?content=${encodeURIComponent(
					userInput,
				)}`,
			);

			// Jika respons sukses
			if (data.status) {
				let res = data.data
					.replace(/\*\*(.*?)\*\*/g, "$1") // Hapus tanda ** di sekitar teks
					.replace(/###/g, " ") // Ganti ### dengan spasi
					.trim();

				await sock.sendMessage(sender, { text: res }, { quoted: msg });
			} else {
				await sock.sendMessage(sender, {
					text: "⚠️ Tidak ada respons dari AI.",
				});
			}
		} catch (error) {
			console.error("Error fetching AI response:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat menghubungi AI.",
			});
		}
	},
};
