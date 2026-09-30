const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    PermissionFlagsBits
} = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

// ==========================================
// KONFIGURASI BOT
// ==========================================
const CONFIG = {
    TOKEN: 'YOUR_DISCORD_BOT_TOKEN', 
    PREFIX: '!', // (Or you can edit with what you prefer)
    CHANNEL_NOTIF: 'YOUR_NOTIFICATION_CHANNEL_ID' // ID channel notifikasi gempa
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Variable penyimpan ID gempa terakhir agar bebas spam
let lastEarthquake = '';

// Daftar Alias Game Populer
const GAME_ALIASES = {
    'gta 5': 'Grand Theft Auto V',
    'gta v': 'Grand Theft Auto V',
    'gta 4': 'Grand Theft Auto IV',
    'gta iv': 'Grand Theft Auto IV',
    'gta sa': 'Grand Theft Auto: San Andreas',
    'csgo': 'Counter-Strike 2',
    'cs 2': 'Counter-Strike 2',
    'cs2': 'Counter-Strike 2',
    'dota': 'Dota 2',
    'pb': 'Point Blank',
    'pes 2021': 'eFootball PES 2021',
    'efootball': 'eFootball 2024',
    're4': 'Resident Evil 4',
    're4 remake': 'Resident Evil 4',
    're2': 'Resident Evil 2',
    're3': 'Resident Evil 3',
    'rdr2': 'Red Dead Redemption 2',
    'rdr 2': 'Red Dead Redemption 2',
    'fifa 23': 'EA SPORTS FC 24',
    'fc 24': 'EA SPORTS FC 24',
    'fc24': 'EA SPORTS FC 24',
    'mc': 'Minecraft'
};

// ==========================================
// FITUR 1: AUTO-CHECK GEMPA BMKG (BEBAS SPAM)
// ==========================================
async function checkBMKG() {
    try {
        const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        if (!response.data || !response.data.Infogempa || !response.data.Infogempa.gempa) return;
        
        const gempa = response.data.Infogempa.gempa;
        const eventId = `${gempa.Tanggal}-${gempa.Jam}-${gempa.Wilayah}`;

        if (eventId === lastEarthquake) return;
        lastEarthquake = eventId;
        
        const channel = client.channels.cache.get(CONFIG.CHANNEL_NOTIF);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🚨 INFO GEMPA TERKINI (BMKG)')
                .setColor('#FF0000')
                .setThumbnail(`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`)
                .addFields(
                    { name: 'Waktu', value: `${gempa.Tanggal} | ${gempa.Jam}`, inline: true },
                    { name: 'Magnitudo', value: `**${gempa.Magnitude} SR**`, inline: true },
                    { name: 'Kedalaman', value: gempa.Kedalaman, inline: true },
                    { name: 'Lokasi', value: gempa.Wilayah, inline: false },
                    { name: 'Potensi Tsunami', value: gempa.Potensi, inline: false }
                )
                .setFooter({ text: 'Sumber: BMKG Indonesia' })
                .setTimestamp();

            await channel.send({ content: '⚠️ **Peringatan Gempa Baru Terdeteksi!**', embeds: [embed] });
        }
    } catch (error) {
        console.error('Error fetching BMKG data:', error.message);
    }
}

client.on('clientReady', () => {
    console.log(`✅ Bot Berhasil Login sebagai ${client.user.tag}`);
    checkBMKG();
    setInterval(checkBMKG, 3 * 60 * 1000); // Check tiap 3 menit
});

// ==========================================
// HELPER KOMPONEN DASHBOARD (BUTTONS & DROPDOWN)
// ==========================================
function getMainMenuComponents() {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('main_menu_select')
        .setPlaceholder('👇 Pilih Fitur / Informasi di sini...')
        .addOptions([
            {
                label: 'Info Gempa Terkini',
                description: 'Cek laporan gempa bumi dari BMKG',
                value: 'btn_gempa',
                emoji: '🚨'
            },
            {
                label: 'Cari Info Anime',
                description: 'Cek skor, episode, & ringkasan anime',
                value: 'btn_search_anime',
                emoji: '🎌'
            },
            {
                label: 'Berita Tekno Terkini',
                description: '5 berita teknologi populer hari ini',
                value: 'btn_berita_tekno',
                emoji: '📰'
            },
            {
                label: 'Cari Berita Spesifik',
                description: 'Cari berita berdasarkan kata kunci bebas',
                value: 'btn_search_berita',
                emoji: '🔍'
            },
            {
                label: 'Cari Info Game Steam',
                description: 'Cek spesifikasi PC & harga game Steam',
                value: 'btn_search_game',
                emoji: '🎮'
            },
            {
                label: 'Cari Harga Bahan Makanan',
                description: 'Cek nominal harga pasar bahan pokok per daerah',
                value: 'btn_search_harga',
                emoji: '🛒'
            }
        ]);

    const rowMenu = new ActionRowBuilder().addComponents(selectMenu);

    const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_gempa')
            .setLabel('Info Gempa')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚨'),
        new ButtonBuilder()
            .setCustomId('btn_search_anime')
            .setLabel('Cari Anime')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎌'),
        new ButtonBuilder()
            .setCustomId('btn_berita_tekno')
            .setLabel('Berita Tekno')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📰'),
        new ButtonBuilder()
            .setCustomId('btn_search_harga')
            .setLabel('Harga Pangan')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🛒'),
        new ButtonBuilder()
            .setCustomId('btn_restart')
            .setLabel('Restart Bot')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔁')
    );

    return [rowMenu, rowButtons];
}

// ==========================================
// MESSAGE COMMANDS (PREFIX)
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // COMMAND: !menu / !help / !start
    if (['help', 'menu', 'start'].includes(command)) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Dashboard Interaktif Bot Multi-Fungsi')
            .setDescription('Silakan klik **Tombol** atau pilih opsi dari **Dropdown Menu** di bawah untuk mengakses fitur tanpa perlu mengetik command manual!')
            .setColor('#5865F2')
            .setFooter({ text: 'Gunakan komponen di bawah untuk akses cepat' });

        return message.reply({ embeds: [embed], components: getMainMenuComponents() });
    }

    if (command === 'ping') {
        return message.reply(`🏓 Pong! Latency bot: **${Date.now() - message.createdTimestamp}ms**`);
    }
});

// ==========================================
// INTERACTION HANDLER (BUTTONS, DROPDOWN, MODALS)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // 1. HANDLER SELECT MENU & BUTTONS
    if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const customId = interaction.isStringSelectMenu() ? interaction.values[0] : interaction.customId;

        // Action: Soft Restart Bot + Auto-Restore Dashboard
        if (customId === 'btn_restart') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: '❌ Kamu tidak memiliki izin (Administrator) untuk merestart bot!', 
                    flags: 64
                });
            }

            await interaction.reply({ 
                content: '🔄 **Sedang merestart koneksi bot...** Mohon tunggu beberapa detik!' 
            });

            console.log(`⚠️ Bot sedang melakukan soft-restart oleh ${interaction.user.tag}`);

            try {
                await client.destroy();
                await client.login(CONFIG.TOKEN);
                console.log('✅ Bot berhasil login kembali!');

                const restoredEmbed = new EmbedBuilder()
                    .setTitle('🤖 Dashboard Interaktif Bot Multi-Fungsi')
                    .setDescription('✅ **Bot berhasil di-restart dan sudah online kembali!**\n\nSilakan klik **Tombol** atau pilih opsi dari **Dropdown Menu** di bawah untuk mengakses fitur kembali:')
                    .setColor('#00E676')
                    .setFooter({ text: 'Status: Online & Siap Digunakan' });

                return interaction.editReply({ 
                    content: '', 
                    embeds: [restoredEmbed], 
                    components: getMainMenuComponents() 
                });

            } catch (err) {
                console.error('❌ Gagal melakukan restart bot:', err.message);
                return interaction.editReply({ 
                    content: '❌ Gagal melakukan restart koneksi bot.' 
                });
            }
        }

        // Action: Check Gempa
        if (customId === 'btn_gempa') {
            await interaction.deferReply({ ephemeral: false });
            try {
                const { data } = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
                const gempa = data.Infogempa.gempa;

                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Info Gempa Bumi Terkini (BMKG)')
                    .setColor('#FF0000')
                    .setThumbnail(`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`)
                    .addFields(
                        { name: '📅 Waktu', value: `${gempa.Tanggal} - ${gempa.Jam}`, inline: true },
                        { name: '💥 Magnitudo', value: `**${gempa.Magnitude} SR**`, inline: true },
                        { name: '🌊 Kedalaman', value: gempa.Kedalaman, inline: true },
                        { name: '📍 Lokasi', value: `${gempa.Wilayah}\n(${gempa.Coordinates})`, inline: false },
                        { name: '🚨 Potensi', value: `**${gempa.Potensi}**`, inline: false }
                    )
                    .setFooter({ text: 'Sumber: BMKG Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal mengambil data gempa.' });
            }
        }

        // Action Pop-Up Form: Cari Anime
        if (customId === 'btn_search_anime') {
            const modal = new ModalBuilder()
                .setCustomId('modal_anime')
                .setTitle('🎌 Cari Info Anime');

            const animeInput = new TextInputBuilder()
                .setCustomId('input_anime')
                .setLabel('Judul Anime')
                .setPlaceholder('Contoh: Attack on Titan, Naruto, One Piece')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(animeInput));
            return interaction.showModal(modal);
        }

        // Action: Berita Tekno
        if (customId === 'btn_berita_tekno') {
            await interaction.deferReply();
            try {
                const feedUrl = `https://news.google.com/rss/search?q=teknologi&hl=id&gl=ID&ceid=ID:id`;
                const { data } = await axios.get(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $ = cheerio.load(data, { xmlMode: true });

                let newsList = [];
                $('item').slice(0, 5).each((i, el) => {
                    const title = $(el).find('title').text().trim();
                    const link = $(el).find('link').text().trim();
                    const source = $(el).find('source').text().trim() || 'Google News';
                    if (title && link) newsList.push(`• [${title}](${link}) — *${source}*`);
                });

                const embed = new EmbedBuilder()
                    .setTitle('🌐 Berita Teknologi Terkini')
                    .setColor('#4285F4')
                    .setDescription(newsList.join('\n\n'))
                    .setFooter({ text: 'Sumber: Google News Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal mengambil berita.' });
            }
        }

        // Action Pop-Up Form: Cari Berita
        if (customId === 'btn_search_berita') {
            const modal = new ModalBuilder()
                .setCustomId('modal_berita')
                .setTitle('🔍 Cari Berita');

            const queryInput = new TextInputBuilder()
                .setCustomId('input_query')
                .setLabel('Masukkan Kata Kunci Berita')
                .setPlaceholder('Contoh: AI, Nvidia, Timnas, Crypto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(queryInput));
            return interaction.showModal(modal);
        }

        // Action Pop-Up Form: Cari Game Steam
        if (customId === 'btn_search_game') {
            const modal = new ModalBuilder()
                .setCustomId('modal_game')
                .setTitle('🎮 Cari Spesifikasi Game Steam');

            const gameInput = new TextInputBuilder()
                .setCustomId('input_game')
                .setLabel('Nama Game / Alias')
                .setPlaceholder('Contoh: GTA V, Cyberpunk 2077, CS2')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(gameInput));
            return interaction.showModal(modal);
        }

        // Action Pop-Up Form: Cari Harga Pangan
        if (customId === 'btn_search_harga') {
            const modal = new ModalBuilder()
                .setCustomId('modal_harga')
                .setTitle('🛒 Cek Harga Bahan Pangan');

            const itemInput = new TextInputBuilder()
                .setCustomId('input_item')
                .setLabel('Nama Bahan Makanan / Komoditas')
                .setPlaceholder('Contoh: Beras, Daging Ayam, Telur, Cabai')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const regionInput = new TextInputBuilder()
                .setCustomId('input_region')
                .setLabel('Wilayah / Daerah (Opsional)')
                .setPlaceholder('Contoh: Jawa Tengah, DKI Jakarta, Surabaya')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(itemInput),
                new ActionRowBuilder().addComponents(regionInput)
            );
            return interaction.showModal(modal);
        }
    }

    // 2. HANDLER SUBMIT FORM POP-UP (MODAL)
    if (interaction.isModalSubmit()) {
        
        // Form Cari Anime Submit (Dual API: Jikan + Kitsu Fallback)
        if (interaction.customId === 'modal_anime') {
            const query = interaction.fields.getTextInputValue('input_anime').trim();
            await interaction.deferReply();

            try {
                const { data } = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (data.data && data.data.length > 0) {
                    const anime = data.data[0];
                    const embed = new EmbedBuilder()
                        .setTitle(anime.title)
                        .setURL(anime.url)
                        .setColor('#2E51A2')
                        .setThumbnail(anime.images.jpg.image_url)
                        .addFields(
                            { name: 'EPISODE', value: `${anime.episodes || '??'} eps`, inline: true },
                            { name: 'SCORE', value: `⭐ ${anime.score || 'N/A'}`, inline: true },
                            { name: 'STATUS', value: anime.status || '-', inline: true },
                            { name: 'GENRE', value: anime.genres ? anime.genres.map(g => g.name).join(', ') : '-', inline: false },
                            { name: 'RINGKASAN', value: anime.synopsis ? anime.synopsis.slice(0, 250) + '...' : 'Tidak ada deskripsi.' }
                        )
                        .setFooter({ text: 'Source: MyAnimeList' });

                    return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
                }
            } catch (e) {
                console.log('Jikan API limit/error, mencoba Kitsu API fallback...');
            }

            try {
                const { data } = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`);
                if (!data.data || data.data.length === 0) {
                    return interaction.editReply(`❌ Anime **"${query}"** tidak ditemukan!`);
                }

                const anime = data.data[0].attributes;
                const embed = new EmbedBuilder()
                    .setTitle(anime.canonicalTitle)
                    .setURL(`https://kitsu.io/anime/${data.data[0].id}`)
                    .setColor('#FF6B6B')
                    .setThumbnail(anime.posterImage ? anime.posterImage.medium : '')
                    .addFields(
                        { name: 'EPISODE', value: `${anime.episodeCount || '??'} eps`, inline: true },
                        { name: 'SCORE', value: `⭐ ${anime.averageRating ? (anime.averageRating / 20).toFixed(2) : 'N/A'}`, inline: true },
                        { name: 'STATUS', value: anime.status || '-', inline: true },
                        { name: 'RINGKASAN', value: anime.synopsis ? anime.synopsis.slice(0, 250) + '...' : 'Tidak ada deskripsi.' }
                    )
                    .setFooter({ text: 'Source: Kitsu.io' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal mengambil data anime.' });
            }
        }

        // Form Cari Berita Submit
        if (interaction.customId === 'modal_berita') {
            const searchQuery = interaction.fields.getTextInputValue('input_query');
            await interaction.deferReply();

            try {
                const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=id&gl=ID&ceid=ID:id`;
                const { data } = await axios.get(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $ = cheerio.load(data, { xmlMode: true });

                let newsList = [];
                $('item').slice(0, 5).each((i, el) => {
                    const title = $(el).find('title').text().trim();
                    const link = $(el).find('link').text().trim();
                    const source = $(el).find('source').text().trim() || 'Google News';
                    if (title && link) newsList.push(`• [${title}](${link}) — *${source}*`);
                });

                const embed = new EmbedBuilder()
                    .setTitle(`🌐 Berita Terkini: ${searchQuery.toUpperCase()}`)
                    .setColor('#4285F4')
                    .setDescription(newsList.join('\n\n'))
                    .setFooter({ text: 'Sumber: Google News Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal mencari berita.' });
            }
        }

        // Form Cari Game Submit
        if (interaction.customId === 'modal_game') {
            const rawQuery = interaction.fields.getTextInputValue('input_game').toLowerCase().trim();
            const query = GAME_ALIASES[rawQuery] || rawQuery;
            await interaction.deferReply();

            try {
                const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=ID`;
                const { data: searchData } = await axios.get(searchUrl);

                if (!searchData.items || searchData.items.length === 0) {
                    return interaction.editReply(`❌ Game **"${query}"** tidak ditemukan di Steam.`);
                }

                const appId = searchData.items[0].id;
                const detailUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=ID&l=english`;
                const { data: detailData } = await axios.get(detailUrl);
                const gameInfo = detailData[appId].data;

                const parseCleanSpecs = (html) => {
                    if (!html) return 'Tidak tersedia.';
                    let text = html.replace(/<strong>Minimum:<\/strong>|<strong>Recommended:<\/strong>/gi, '')
                        .replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

                    let lines = text.split('\n');
                    let result = [];
                    for (let line of lines) {
                        let cleanLine = line.trim();
                        if (!cleanLine || cleanLine.toLowerCase().includes('requires a 64-bit')) continue;
                        cleanLine = cleanLine.replace(/(OS|Processor|CPU|Memory|RAM|Graphics|GPU|DirectX|Storage|Sound Card):/gi, '**$1:**');
                        result.push(cleanLine);
                    }
                    return result.join('\n') || 'Tidak tersedia.';
                };

                let minSpecs = parseCleanSpecs(gameInfo.pc_requirements?.minimum).slice(0, 990);
                let recSpecs = parseCleanSpecs(gameInfo.pc_requirements?.recommended).slice(0, 990);

                let hargaFormatted = gameInfo.is_free ? 'GRATIS / FREE' : (gameInfo.price_overview?.final_formatted || 'Lihat di Steam');

                const embed = new EmbedBuilder()
                    .setTitle(`🎮 ${gameInfo.name}`)
                    .setURL(`https://store.steampowered.com/app/${appId}`)
                    .setColor('#1b2838')
                    .setThumbnail(gameInfo.header_image)
                    .addFields(
                        { name: '💰 HARGA', value: hargaFormatted, inline: true },
                        { name: '📅 RILIS', value: gameInfo.release_date ? gameInfo.release_date.date : 'TBA', inline: true },
                        { name: '🎭 GENRE', value: gameInfo.genres ? gameInfo.genres.map(g => g.description).join(', ') : '-', inline: true },
                        { name: '💻 MINIMUM SPECS', value: minSpecs, inline: false },
                        { name: '🚀 RECOMMENDED SPECS', value: recSpecs, inline: false }
                    )
                    .setFooter({ text: 'Data resmi dari Steam Store Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal mengambil data game dari Steam.' });
            }
        }

        // Form Cari Harga Pangan Submit
        if (interaction.customId === 'modal_harga') {
            const itemQuery = interaction.fields.getTextInputValue('input_item').trim();
            const regionQuery = interaction.fields.getTextInputValue('input_region').trim() || 'Indonesia';
            await interaction.deferReply();

            try {
                const searchKeyword = `harga ${itemQuery} ${regionQuery} per kg hari ini`;
                const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchKeyword)}&hl=id&gl=ID&ceid=ID:id`;
                const { data } = await axios.get(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $ = cheerio.load(data, { xmlMode: true });

                let extractedPrices = [];
                $('item').slice(0, 10).each((i, el) => {
                    const title = $(el).find('title').text().trim();
                    const source = $(el).find('source').text().trim() || 'Pantauan Pasar';
                    
                    const priceMatch = title.match(/Rp\s*[\d\.\,]+\s*(ribu|rb|juta|jt)?/gi);

                    if (priceMatch) {
                        let formattedPrices = priceMatch.map(p => {
                            let clean = p.replace(/\s+/g, ' ').trim();
                            if (/ribu|rb/i.test(clean)) {
                                let numStr = clean.replace(/Rp\s*/i, '').replace(/ribu|rb/i, '').trim().replace(',', '.');
                                let val = parseFloat(numStr) * 1000;
                                if (!isNaN(val)) return `Rp ${val.toLocaleString('id-ID')}`;
                            }
                            if (/juta|jt/i.test(clean)) {
                                let numStr = clean.replace(/Rp\s*/i, '').replace(/juta|jt/i, '').trim().replace(',', '.');
                                let val = parseFloat(numStr) * 1000000;
                                if (!isNaN(val)) return `Rp ${val.toLocaleString('id-ID')}`;
                            }
                            return clean;
                        });

                        const finalPriceText = formattedPrices.join(' - ');
                        extractedPrices.push(`• **${finalPriceText}** — *${source}*\n  _${title}_`);
                    }
                });

                if (extractedPrices.length > 0) {
                    const uniqueResults = [...new Set(extractedPrices)].slice(0, 3);
                    const embed = new EmbedBuilder()
                        .setTitle(`🛒 Hasil Scraping Harga Pasar Real-Time`)
                        .setColor('#00E676')
                        .addFields(
                            { name: '📍 Wilayah', value: regionQuery.toUpperCase(), inline: true },
                            { name: '🌾 Komoditas', value: itemQuery.toUpperCase(), inline: true },
                            { name: '💰 Laporan Nominal Harga', value: uniqueResults.join('\n\n'), inline: false }
                        )
                        .setFooter({ text: 'Data scraped langsung dari laporan harga pangan publik' });

                    return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
                }

                return interaction.editReply({ content: `❌ Data nominal harga spesifik untuk **"${itemQuery}"** di wilayah **${regionQuery.toUpperCase()}** tidak ditemukan.` });
            } catch (err) {
                return interaction.editReply({ content: '❌ Gagal melakukan scraping harga.' });
            }
        }
    }
});

// ==========================================
// GLOBAL CRASH HANDLER (Mencegah Bot Mati Total)
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRASH PREVENTED] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('⚠️ [CRASH PREVENTED] Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('⚠️ [CRASH PREVENTED] Exception Monitor:', err);
});

client.on('error', (error) => {
    console.error('⚠️ [DISCORD CLIENT ERROR]:', error.message);
});

// Login Bot ke Discord
client.login(CONFIG.TOKEN);
