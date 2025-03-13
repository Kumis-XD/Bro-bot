import util from "util";

export default {
	command: "#",
	name: "「 DEBUGING 」",
	description: "Debuging parameter & endpoint.",
	execute: async (sock, sender, text, msg) => {
		const budy = typeof text === "string" ? text : "";
		if (msg.key.fromMe && text == "#") return;

		// Fungsi untuk mengembalikan hasil dengan format JSON atau string
		function Return(result) {
			const formattedResult = util.format(result);
			const resultJson = JSON.stringify(result, null, 2);
			const response = result == undefined ? formattedResult : resultJson;
			return sock.sendMessage(
				sender,
				{ text: response },
				{ quoted: msg },
			);
		}

		try {
			// Validasi input sebelum menggunakan eval (untuk keamanan)
			if (budy.slice(2).trim()) {
				// Eksekusi kode JavaScript secara aman
				const evalResult = await eval(
					`(async () => { return ${budy.slice(2)} })()`,
				);
				// Kirim hasil evaluasi
				await sock.sendMessage(
					sender,
					{ text: util.format(evalResult) },
					{ quoted: msg },
				);
			} else {
				await sock.sendMessage(
					sender,
					{
						text: "⚠️ Tidak ada kode yang diberikan untuk dievaluasi.",
					},
					{ quoted: msg },
				);
			}
		} catch (e) {
			// Menangani kesalahan dalam eksekusi kode
			await sock.sendMessage(
				sender,
				{ text: `❌ Error: ${e.message}` },
				{ quoted: msg },
			);
		}
	},
};
