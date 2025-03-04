import axios from "axios";

export default {
	command: ".blackbox",
	name: "「 BLACKBOX AI 」",
	description: "Menampilkan jawaban dari Blackbox AI",
	execute: async (sock, sender, text, msg) => {
		try {
			const userInput = typeof text === "string" ? text.trim() : "";

			if (!userInput) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan pertanyaan setelah perintah .blackbox",
				});
			}

			// Mengirim permintaan ke API Blackbox AI
			const { data } = await axios.get(
				`https://api.siputzx.my.id/api/ai/blackboxai?content=${encodeURIComponent(
					userInput,
				)}`,
			);

			// Jika respons sukses
			if (data.status) {

			  let res = data.data
					.replace(/\*\*(.*?)\*\*/g, "$1") // Hapus tanda ** di sekitar teks
					.replace(/###/g, " ") // Ganti ### dengan spasi
					.trim();

				sock.sendMessage(
					sender,
					{ text: res },
					{ quoted: msg },
				);
			} else {
				sock.sendMessage(sender, {
					text: "⚠️ Tidak ada respons dari AI.",
				});
			}
		} catch (error) {
			console.error("Error fetching AI response:", error);
			sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat menghubungi AI.",
			});
		}
	},
};
