import axios from "axios";

function randomNumber() {
	let randomNumber = Math.floor(Math.random() * 1000000);
	return randomNumber.toString().padStart(6, "0");
}

async function upscale(buffer) {
	const blob = new Blob([buffer], { type: "image/png" });
	let filename = randomNumber() + ".png";
	let formData = new FormData();
	formData.append("image", blob, filename);

	let { data } = await axios.post(
		"https://api.imggen.ai/guest-upload",
		formData,
		{
			headers: {
				"content-type": "multipart/form-data",
				origin: "https://imggen.ai",
				referer: "https://imggen.ai/",
				"user-agent": "Mozilla/5.0",
			},
		},
	);

	let result = await axios.post(
		"https://api.imggen.ai/guest-upscale-image",
		{
			image: {
				url: "https://api.imggen.ai" + data.image.url,
				name: data.image.name,
				original_name: data.image.original_name,
				folder_name: data.image.folder_name,
				extname: data.image.extname,
			},
		},
		{
			headers: {
				"content-type": "application/json",
				origin: "https://imggen.ai",
				referer: "https://imggen.ai/",
				"user-agent": "Mozilla/5.0",
			},
		},
	);

	return `https://api.imggen.ai${result.data.upscaled_image}`;
}

export default {
	command: ".hd",
	name: "「 CHANGE RESOLUTION 」",
	description: "Ubah gambar menjadi HD resolusi.",
	execute: async (sock, sender, text, msg, quotd) => {
		try {
			let q = msg.quoted ? msg.quoted : msg;
			let mime = (q.msg || quotd).mimetype || "";

			if (!mime.startsWith("image/")) {
				throw "Silakan kirim gambar dengan caption *hd/remini* atau reply gambar!";
			}

			let media = await sock.downloadMediaMessage(quotd);
			if (!media) throw "Gagal mengunduh gambar.";

			let upscaledUrl = await upscale(media);
			if (!upscaledUrl) throw "Gagal melakukan Upscale gambar.";

			await sock.sendMessage(
				sender,
				{
					image: { url: upscaledUrl },
					caption: `Beres om.`,
				},
				{ quoted: msg },
			);
		} catch (error) {
			await sock.sendMessage(
				sender,
				{
					text: `❌ *Error:* ${error}`,
				},
				{ quoted: msg },
			);
		}
	},
};
