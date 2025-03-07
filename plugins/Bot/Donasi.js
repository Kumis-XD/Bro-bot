export default {
	command: ".donasi",
	name: "「 DONASI BOT 」",
	description: "Donasi bot agar bot semakin berkembang.",
	execute: async (sock, sender, text, msg) => {
		await sock.sendMessage(sender, {
			image: {
				url: "https://editor.vreden.my.id/qris2?url=https://cloudkuimages.xyz/uploads/images/67c1ee6cce95c.jpg&nominal=Seiklasnya&expired=Permanent&store=NURQOLBIFADIL",
			},
			caption: `Setiap donasi yang kamu berikan akan digunakan untuk:
✅ Menjaga bot tetap online 24/7
✅ Menambahkan fitur baru dan update
✅ Meningkatkan performa bot

Terima kasih atas dukunganmu! ❤️ Jika sudah donasi, silakan hubungi admin agar bisa mendapatkan akses premium!

🚀 Hubungi Admin: wa.me/6285867760406`,
			contextInfo: {
				externalAdReply: {
					showAdAttribution: true,
					mediaType: 1,
					mediaUrl:
						"https://editor.vreden.my.id/qris2?url=https://cloudkuimages.xyz/uploads/images/67c1ee6cce95c.jpg&nominal=Seiklasnya&expired=Permanent&store=NURQOLBIFADIL",
					title: "「 Padz x Bro Bot 」",
					body: "Donasi bot by padz",
					sourceUrl:
						"https://editor.vreden.my.id/qris2?url=https://cloudkuimages.xyz/uploads/images/67c1ee6cce95c.jpg&nominal=Seiklasnya&expired=Permanent&store=NURQOLBIFADIL",
					thumbnailUrl:
						"https://files.fotoenhancer.com/uploads/4f3f4c83-2e52-4296-8063-12756c823d05.jpg",
					renderLargerThumbnail: false,
				},
			},
		});
	},
};
