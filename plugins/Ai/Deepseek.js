import axios from "axios";
import dotenv from "dotenv";

// Memuat konfigurasi dari file .env
dotenv.config();

export default {
	command: ".ai",
	name: "「 DEEPSEEK AI 」",
	description: "Menampilkan jawaban AI berdasarkan input pengguna",
	execute: async (sock, sender, text, msg) => {
		try {
			const userInput = typeof text === "string" ? text.trim() : "";

			if (!userInput) {
				return sock.sendMessage(sender, {
					text: "⚠️ Mohon masukkan pertanyaan setelah perintah .ai",
				});
			}

			// Prompt sistem untuk mengatur identitas Bro-AI
			const systemMessage = `System: Kamu adalah Bro-AI, sebuah AI cerdas yang dirancang oleh ${process.env.OWNER_NAME}. 
			Jika seseorang bertanya siapa namamu, jawab dengan: "Halo saya Bro-AI yang dirancang oleh ${process.env.OWNER_NAME}". 
			Selalu berbicara dengan jelas dan ringkas.`;

			// Tambahan logika jika pengguna bertanya tentang owner
			if (/owner(mu| siapa| mana)/i.test(userInput)) {
				const ownerInfo = `Nama ownerku ${process.env.OWNER_NAME}, nomor ownerku ${process.env.OWNER_NUMBER}`;
				return sock.sendMessage(sender, { text: ownerInfo });
			}

			// Mengirim permintaan ke API AI
			const { data } = await axios.post(
				"https://mind.hydrooo.web.id/v1/chat/",
				{
					model: "@groq/deepseek-r1-distill-llama-70b",
					content: `${systemMessage} ${userInput}`,
				},
			);

			if (data.status === 200) {
				// Membersihkan respons AI
				let res = data.result
					.replace(/<think>.*?<\/think>/gs, "") // Hapus blok <think>
					.replace(/\*\*(.*?)\*\*/g, "$1") // Hapus tanda ** di sekitar teks
					.replace(/###/g, " ") // Ganti ### dengan spasi
					.trim();

				// Mengirimkan respons ke pengguna
				sock.sendMessage(sender, { text: res }, { quoted: msg });
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
