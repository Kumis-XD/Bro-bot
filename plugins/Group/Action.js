export default {
	command: ".group",
	name: "「 GROUP ACTION 」",
	description: "Aksi untuk mengelola grup.",
	async execute(sock, sender, text, msg) {
		const isGroup = sender.includes("@g.us");
		if (!isGroup)
			return sock.sendMessage(sender, {
				text: "❌ Perintah ini hanya bisa digunakan di grup!",
			});

		const isAdmin = await checkAdmin(sock, sender, msg.key.participant);
		if (!isAdmin)
			return sock.sendMessage(sender, {
				text: "❌ Kamu harus menjadi admin untuk menggunakan perintah ini!",
			});

		const args = text.split(" ").slice(1);
		const action = args[0]?.toLowerCase();
		const groupId = sender;

		if (!action) {
			const helpMessage =
				`⚙️ *Pengaturan Grup*\n\n` +
				`📌 *.group name [nama baru]* → Ubah nama grup\n` +
				`📌 *.group desc [deskripsi baru]* → Ubah deskripsi grup\n` +
				`📌 *.group lock* → Hanya admin yang bisa mengirim pesan\n` +
				`📌 *.group unlock* → Semua anggota bisa mengirim pesan\n` +
				`📌 *.group add [nomor]* → Tambah anggota\n` +
				`📌 *.group remove [nomor]* → Hapus anggota\n` +
				`📌 *.group promote [nomor]* → Jadikan admin\n` +
				`📌 *.group demote [nomor]* → Hapus admin`;

			return sock.sendMessage(
				sender,
				{ text: helpMessage },
				{ quoted: msg },
			);
		}

		try {
			switch (action) {
				case "name":
					const newName = args.slice(1).join(" ");
					if (!newName)
						return sock.sendMessage(sender, {
							text: "❌ Harap masukkan nama grup baru!",
						});
					await sock.groupUpdateSubject(groupId, newName);
					sock.sendMessage(sender, {
						text: `✅ Nama grup berhasil diubah menjadi *${newName}*`,
					});
					break;

				case "desc":
					const newDesc = args.slice(1).join(" ");
					if (!newDesc)
						return sock.sendMessage(sender, {
							text: "❌ Harap masukkan deskripsi baru!",
						});
					await sock.groupUpdateDescription(groupId, newDesc);
					sock.sendMessage(sender, {
						text: "✅ Deskripsi grup berhasil diubah!",
					});
					break;

				case "lock":
					await sock.groupSettingUpdate(groupId, "announcement");
					sock.sendMessage(sender, {
						text: "✅ Grup dikunci! Sekarang hanya admin yang bisa mengirim pesan.",
					});
					break;

				case "unlock":
					await sock.groupSettingUpdate(groupId, "not_announcement");
					sock.sendMessage(sender, {
						text: "✅ Grup dibuka! Sekarang semua anggota bisa mengirim pesan.",
					});
					break;

				case "add":
				case "remove":
				case "promote":
				case "demote":
					// Cek apakah ada quoted
					const quoted =
						msg.message?.extendedTextMessage?.contextInfo
							?.quotedMessage;
					const participantFromQuoted =
						msg.message?.extendedTextMessage?.contextInfo
							?.participant;

					let targetNumber;
					if (quoted && participantFromQuoted) {
						// Jika ada quoted, gunakan participant dari quoted
						targetNumber =
							participantFromQuoted.replace(/\D/g, "") +
							"@s.whatsapp.net";
					} else if (args[1]) {
						// Jika tidak ada quoted, gunakan nomor yang diketik
						targetNumber =
							args[1].replace(/\D/g, "") + "@s.whatsapp.net";
					} else {
						return sock.sendMessage(sender, {
							text: `❌ Harap reply pesan anggota atau masukkan nomor untuk ${
								action === "add" ? "ditambahkan" : "dikeluarkan"
							}!`,
						});
					}

					if (!/^\d+@s.whatsapp.net$/.test(targetNumber))
						return sock.sendMessage(sender, {
							text: "❌ Nomor tidak valid! Gunakan format: *.group add 628xxx* atau reply pesan pengguna.",
						});

					await sock.groupParticipantsUpdate(
						groupId,
						[targetNumber],
						action,
					);
					sock.sendMessage(sender, {
						text: `✅ *${targetNumber.replace(
							"@s.whatsapp.net",
							"",
						)}* ${
							action === "add"
								? "berhasil ditambahkan ke grup!"
								: action === "remove"
								? "telah dikeluarkan dari grup!"
								: action === "promote"
								? "sekarang adalah admin grup!"
								: "bukan lagi admin grup!"
						}`,
					});
					break;

				default:
					sock.sendMessage(sender, {
						text: "❌ Perintah tidak ditemukan! Ketik *.group* untuk melihat daftar perintah.",
					});
			}
		} catch (error) {
			console.error("❌ Error:", error);
			sock.sendMessage(sender, {
				text: "⚠️ Terjadi kesalahan! Coba lagi nanti.",
			});
		}
	},
};

// Fungsi untuk mengecek apakah pengguna adalah admin
async function checkAdmin(sock, groupId, user) {
	try {
		const groupMetadata = await sock.groupMetadata(groupId);
		const participants = groupMetadata.participants;
		const userInfo = participants.find((p) => p.id === user);
		return userInfo?.admin === "admin" || userInfo?.admin === "superadmin";
	} catch (error) {
		console.error("❌ Error saat mengecek admin:", error);
		return false;
	}
}
