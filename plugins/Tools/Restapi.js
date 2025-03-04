import axios from "axios";

export default {
	command: ".api",
	name: "「 REST API 」",
	description: "Mengakses data dari API",
	execute: async (sock, sender, text, msg) => {
		try {
			// Parsing perintah untuk GET, POST, PUT, atau DELETE
			const apiMatch = text.match(
				/^\.api\s+(get|post|put|delete)\s+(\S+)(?:\s+(.+))?/i,
			);
			if (!apiMatch) {
				return sock.sendMessage(sender, {
					text:
						"⚠️ Format salah! Gunakan:\n" +
						"📌 *.api get <url>* → Fetch data dari API\n" +
						"📌 *.api post <url> <json_data>* → Kirim data ke API\n" +
						"📌 *.api put <url> <json_data>* → Update data di API\n" +
						"📌 *.api delete <url>* → Hapus data di API",
				});
			}

			const [, method, url, rawData] = apiMatch;

			// Jika GET request
			if (method.toLowerCase() === "get") {
				const { data } = await axios.get(url);
				return sock.sendMessage(sender, {
					text: `📡 *GET Response:*\n\n${JSON.stringify(
						data,
						null,
						2,
					)}`,
				});
			}

			// Jika POST atau PUT request (memerlukan data JSON)
			if (
				method.toLowerCase() === "post" ||
				method.toLowerCase() === "put"
			) {
				if (!rawData) {
					return sock.sendMessage(sender, {
						text: `⚠️ Masukkan data JSON untuk ${method.toUpperCase()} request!`,
					});
				}

				let requestData;
				try {
					requestData = JSON.parse(rawData);
				} catch (error) {
					return sock.sendMessage(sender, {
						text: "⚠️ Format JSON tidak valid!",
					});
				}

				const { data } = await axios[method.toLowerCase()](
					url,
					requestData,
				);
				return sock.sendMessage(sender, {
					text: `📡 *${method.toUpperCase()} Response:*\n\n${JSON.stringify(
						data,
						null,
						2,
					)}`,
				});
			}

			// Jika DELETE request
			if (method.toLowerCase() === "delete") {
				const { data } = await axios.delete(url);
				return sock.sendMessage(sender, {
					text: `📡 *DELETE Response:*\n\n${JSON.stringify(
						data,
						null,
						2,
					)}`,
				});
			}
		} catch (error) {
			console.error("❌ API Error:", error.message);
			sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan saat mengakses API.",
			});
		}
	},
};
