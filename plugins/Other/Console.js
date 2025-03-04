import { exec } from "child_process";

export default {
	command: "=>",
	name: "「 CONSOLE 」",
	description: "Menjalankan perintah terminal dari chat.",
	execute: async (sock, sender, text, msg) => {
		try {
			const command = text.replace(/^\=>\s+/, "").trim();

			if (!command) {
				await sock.sendMessage(sender, {
					text: "⚠️ Harap masukkan perintah terminal untuk dieksekusi!",
				});
				return;
			}

			exec(
				command,
				{ shell: "/bin/bash" },
				async (error, stdout, stderr) => {
					let output =
						stdout ||
						stderr ||
						"✅ Perintah berhasil dieksekusi tetapi tidak ada output.";

					if (error) {
						output = `❌ **Error:**\n\`\`\`${error.message}\`\`\``;
					} else if (stderr) {
						output = `⚠️ **Peringatan:**\n\`\`\`${stderr}\`\`\``;
					}

					await sock.sendMessage(sender, { text: output });
				},
			);
		} catch (error) {
			await sock.sendMessage(sender, {
				text: `❌ **Error Eksekusi:**\n\`\`\`${error}\`\`\``,
			});
		}
	},
};
