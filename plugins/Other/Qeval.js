import util from "util";

export default {
	command: ">",
	name: "「 MESSAGE EVAL 」",
	description: "Menjalankan kode dari pesan yang dikutip.",
	execute: async (sock, sender, text, msg, quotd) => {
		if (quotd == ">") return;

		// Cek apakah ada teks yang dikutip dan pastikan itu string
		if (!quotd) {
			return await sock.sendMessage(
				sender,
				{ text: "⚠️ Tidak ada teks dalam pesan yang dikutip!" },
				{ quoted: msg },
			);
		}

		let teks;
		try {
			teks = await eval(`(async () => { ${quotd} })()`);
		} catch (e) {
			teks = e;
		}

		await sock.sendMessage(
			sender,
			{ text: util.format(quotd) },
			{ quoted: msg },
		);
	},
};
