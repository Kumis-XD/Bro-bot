export default {
	command: ".group",
	name: "「 GROUP ACTION 」",
	description: "Aksi untuk group.",
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

		const quotedMessage = {
			key: {
				remoteJid: "0",
				fromMe: false,
				participant: "@s.whatsapp.net",
			},
			message: {
				conversation: "Undangan chat group",
			},
		};

		const args = text.split(" ").slice(1);
		const action = args[0];

		if (!action) {
			return sock.sendMessage(
				sender,
				{
					text: `⚙️ *Pengaturan Grup*\n\nGunakan perintah berikut:\n\n📌 *.group name [nama baru]* → Ubah nama grup\n📌 *.group desc [deskripsi baru]* → Ubah deskripsi grup\n📌 *.group lock* → Hanya admin yang bisa mengirim pesan\n📌 *.group unlock* → Semua anggota bisa mengirim pesan\n📌 *.group add [nomor]* → Tambah anggota\n📌 *.group remove [nomor]* → Hapus anggota\n📌 *.group promote [nomor]* → Jadikan admin\n📌 *.group demote [nomor]* → Hapus admin`,
				},
				{ quoted: quotedMessage },
			);
		}

		const groupId = sender;

		switch (action.toLowerCase()) {
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
					text: `✅ Deskripsi grup berhasil diubah!`,
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
				const addNumber =
					args[1]?.replace(/\D/g, "") + "@s.whatsapp.net";
				if (!addNumber)
					return sock.sendMessage(sender, {
						text: "❌ Harap masukkan nomor anggota yang ingin ditambahkan!",
					});
				await sock.groupParticipantsUpdate(groupId, [addNumber], "add");
				sock.sendMessage(sender, {
					text: `✅ Berhasil menambahkan *${args[1]}* ke grup!`,
				});
				break;

			case "remove":
				const removeNumber =
					args[1]?.replace(/\D/g, "") + "@s.whatsapp.net";
				if (!removeNumber)
					return sock.sendMessage(sender, {
						text: "❌ Harap masukkan nomor anggota yang ingin dihapus!",
					});
				await sock.groupParticipantsUpdate(
					groupId,
					[removeNumber],
					"remove",
				);
				sock.sendMessage(sender, {
					text: `✅ Berhasil mengeluarkan *${args[1]}* dari grup!`,
				});
				break;

			case "promote":
				const promoteNumber =
					args[1]?.replace(/\D/g, "") + "@s.whatsapp.net";
				if (!promoteNumber)
					return sock.sendMessage(sender, {
						text: "❌ Harap masukkan nomor yang ingin dijadikan admin!",
					});
				await sock.groupParticipantsUpdate(
					groupId,
					[promoteNumber],
					"promote",
				);
				sock.sendMessage(sender, {
					text: `✅ *${args[1]}* sekarang adalah admin grup!`,
				});
				break;

			case "demote":
				const demoteNumber =
					args[1]?.replace(/\D/g, "") + "@s.whatsapp.net";
				if (!demoteNumber)
					return sock.sendMessage(sender, {
						text: "❌ Harap masukkan nomor yang ingin dihapus sebagai admin!",
					});
				await sock.groupParticipantsUpdate(
					groupId,
					[demoteNumber],
					"demote",
				);
				sock.sendMessage(sender, {
					text: `✅ *${args[1]}* bukan lagi admin grup!`,
				});
				break;

			default:
				sock.sendMessage(sender, {
					text: "❌ Perintah tidak ditemukan! Ketik *.group* untuk melihat daftar perintah.",
				});
				break;
		}
	},
};

async function checkAdmin(sock, groupId, user) {
	const groupMetadata = await sock.groupMetadata(groupId);
	const participants = groupMetadata.participants;
	const userInfo = participants.find((p) => p.id === user);
	return userInfo?.admin === "admin" || userInfo?.admin === "superadmin";
}
