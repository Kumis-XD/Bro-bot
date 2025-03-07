import axios from "axios";

export default {
	command: ".joko",
	name: "「 JOKO AI 」",
	description: "Chat dengan Joko AI.",
	execute: async (sock, sender, text, msg) => {
		try {
			// Ambil teks pertanyaan setelah perintah .joko
			const query = text.replace(/^.joko\s*/, "").trim();

			// Validasi input
			if (!query) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon berikan pertanyaan untuk Joko!",
				});
			}

			// Panggil API Joko
			const { data: jokoResponse } = await axios.get(
				`https://api.siputzx.my.id/api/ai/joko?content=${encodeURIComponent(
					query,
				)}`,
			);

			// Validasi respons API
			if (!jokoResponse?.status || !jokoResponse?.data) {
				return sock.sendMessage(sender, {
					text: "⚠️ Joko tidak bisa menjawab saat ini, coba lagi nanti!",
				});
			}

			// Kirim jawaban Joko ke pengguna
			await sock.sendMessage(
				sender,
				{
					text: jokoResponse.data,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error?.message || error);
			await sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Joko sedang sibuk, coba lagi nanti.",
			});
		}
	},
};
