import axios from "axios";

async function removebg(buffer) {
	try {
		const image = buffer.toString("base64");
		let res = await axios.post(
			"https://us-central1-ai-apps-prod.cloudfunctions.net/restorePhoto",
			{
				image: `data:image/png;base64,${image}`,
				model: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
			},
		);
		const data = res.data?.replace(`"`, "");
		if (!data) throw "Gagal menghapus background!";
		return data;
	} catch (e) {
		throw `Error: ${e.message}`;
	}
}

export default {
	command: ".rmbg",
	name: "「 BACKGROUND REMOVER 」",
	description: "Menghapus latar belakang gambar.",
	execute: async (sock, sender, text, msg, quotd) => {
		try {
			let q = msg.quoted ? msg.quoted : msg;
			let mime = (q.msg || quotd).mimetype || "";

			if (!mime || !mime.startsWith("image/")) throw "Mana Gambar Nya?.";

			let media = await sock.downloadMediaMessage(quotd);
			let resultUrl = await removebg(media);

			await sock.sendMessage(
				sender,
				{
					image: { url: resultUrl },
					caption: "Beres om.",
				},
				{ quoted: msg },
			);
		} catch (error) {
			await sock.sendMessage(
				sender,
				{ text: `❌ *Error:* ${error}` },
				{ quoted: msg },
			);
		}
	},
};
