import axios from "axios";

export default {
	command: ".mistral",
	name: "「 MISTRAL AI 」",
	description: "Menampilkan jawaban dari Mistral AI",
	execute: async (sock, sender, text, msg) => {
		try {
			const userInput = typeof text === "string" ? text.trim() : "";

			if (!userInput) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan pertanyaan setelah perintah .mistral",
				});
			}

			// Mengirim permintaan ke API Mistral AI
			const { data } = await axios.get(
				`https://api.siputzx.my.id/api/ai/mistral?prompt=You%20are%20an%20assistant%20that%20always%20responds%20in%20Indonesian%20with%20a%20friendly%20and%20informal%20tone&message=${encodeURIComponent(
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
