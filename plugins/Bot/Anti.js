export default {
	command: ".antiopsi",
	name: "「️ DISPLAY ANTIFEATURE 」",
	description: "Pilihan opsi aktivasi keamanan.",
	execute: async (sock, sender, text, msg) => {
		try {
			let ppUrl;
			try {
				ppUrl = await sock.profilePictureUrl(sender, "image");
			} catch (err) {
				ppUrl = "https://i.ibb.co.com/QFHVz79s/4fd4dbf019b404a6e7ea4bf2b313acd8.jpg"; // Default gambar jika gagal mengambil PP
			}

			await sock.sendMessage(
				sender,
				{
					image: { url: ppUrl },
					contextInfo: {
						externalAdReply: {
							showAdAttribution: true,
							mediaType: 1,
							mediaUrl:
								"https://i.ibb.co.com/QFHVz79s/4fd4dbf019b404a6e7ea4bf2b313acd8.jpg",
							title: "「 🔐 OWNER SECURITY OPTIONS 」",
							body: "Atur fitur keamanan bot sesuai kebutuhan!",
							sourceUrl: "",
							thumbnailUrl:
								"https://i.ibb.co.com/QFHVz79s/4fd4dbf019b404a6e7ea4bf2b313acd8.jpg",
							renderLargerThumbnail: true,
						},
					},
					caption: `🔒 *[ OWNER SECURITY OPTIONS ]* 🔒\n\n🛠️ *Silakan pilih fitur keamanan yang ingin diaktifkan atau dinonaktifkan!*`,
					footer: `🤖 © Bro-Bot | Pilih opsi di bawah ⬇️`,
					mentioned: [sender],
					buttons: [
						{
							buttonId: "action",
							buttonText: {
								displayText: "⚙️ Konfigurasi Keamanan",
							},
							type: 4,
							nativeFlowInfo: {
								name: "single_select",
								paramsJson: JSON.stringify({
									title: "🔹 Pilih Opsi Keamanan",
									sections: [
										{
											title: "📎 『 ANTILINK 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "🚫 ANTILINK SETTING",
													title: "🔗 ANTILINK",
													description:
														"✅ Aktifkan Antilink",
													id: ".antilink on",
												},
												{
													header: "🚫 ANTILINK SETTING",
													title: "🔗 ANTILINK",
													description:
														"❌ Matikan Antilink",
													id: ".antilink off",
												},
											],
										},
										{
											title: "🎥 『 ANTIMEDIA 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "📵 ANTIMEDIA SETTING",
													title: "📷 ANTIMEDIA",
													description:
														"✅ Aktifkan Antimedia",
													id: ".antimedia on",
												},
												{
													header: "📵 ANTIMEDIA SETTING",
													title: "📷 ANTIMEDIA",
													description:
														"❌ Matikan Antimedia",
													id: ".antimedia off",
												},
											],
										},
										{
											title: "🚀 『 ANTISPAM 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "⛔ ANTISPAM SETTING",
													title: "📩 ANTISPAM",
													description:
														"✅ Aktifkan Antispam",
													id: ".antispam on",
												},
												{
													header: "⛔ ANTISPAM SETTING",
													title: "📩 ANTISPAM",
													description:
														"❌ Matikan Antispam",
													id: ".antispam off",
												},
											],
										},
										{
											title: "🤖 『 AUTOAI 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "🧠 AUTOAI SETTING",
													title: "🤖 AUTOAI",
													description:
														"✅ Aktifkan AutoAI",
													id: ".autoai on",
												},
												{
													header: "🧠 AUTOAI SETTING",
													title: "🤖 AUTOAI",
													description:
														"❌ Matikan AutoAI",
													id: ".autoai off",
												},
											],
										},
										{
											title: "📖 『 AUTOREAD 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "👀 AUTOREAD SETTING",
													title: "📩 AUTOREAD",
													description:
														"✅ Aktifkan AutoRead",
													id: ".autoread on",
												},
												{
													header: "👀 AUTOREAD SETTING",
													title: "📩 AUTOREAD",
													description:
														"❌ Matikan AutoRead",
													id: ".autoread off",
												},
											],
										},
										{
											title: "🕌 『 AUTOSHOLAT 』",
											highlight_label: "🔹 Bro-Bot",
											rows: [
												{
													header: "🕌 AUTOSHOLAT SETTING",
													title: "🕋 AUTOSHOLAT",
													description:
														"✅ Aktifkan AutoSholat",
													id: ".autosholat on",
												},
												{
													header: "🕌 AUTOSHOLAT SETTING",
													title: "🕋 AUTOSHOLAT",
													description:
														"❌ Matikan AutoSholat",
													id: ".autosholat off",
												},
											],
										},
									],
								}),
							},
						},
					],
					headerType: 1,
					viewOnce: true,
				},
				{ quoted: msg },
			);
		} catch (error) {
			console.error("❌ Error:", error);
			await sock.sendMessage(sender, {
				text: "⚠️ *Terjadi kesalahan! Coba lagi nanti.*",
			});
		}
	},
};
