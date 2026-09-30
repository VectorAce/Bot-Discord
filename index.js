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
// BOT CONFIGURATION
// ==========================================
const CONFIG = {
    TOKEN: 'YOUR_DISCORD_BOT_TOKEN', 
    PREFIX: '!', // Command prefix
    CHANNEL_NOTIF: 'YOUR_NOTIFICATION_CHANNEL_ID' // Earthquake notification channel ID
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Cache variable for tracking the last processed earthquake to prevent spam
let lastEarthquake = '';

// Dictionary of popular game aliases for quick searching
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
// FEATURE 1: REAL-TIME BMKG EARTHQUAKE CHECK
// ==========================================
async function checkBMKG() {
    try {
        const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        if (!response.data || !response.data.Infogempa || !response.data.Infogempa.gempa) return;
        
        const gempa = response.data.Infogempa.gempa;
        const eventId = `${gempa.Tanggal}-${gempa.Jam}-${gempa.Wilayah}`;

        // Skip execution if this earthquake event was already notified
        if (eventId === lastEarthquake) return;
        lastEarthquake = eventId;
        
        const channel = client.channels.cache.get(CONFIG.CHANNEL_NOTIF);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🚨 LATEST EARTHQUAKE ALERT (BMKG)')
                .setColor('#FF0000')
                .setThumbnail(`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`)
                .addFields(
                    { name: 'Time', value: `${gempa.Tanggal} | ${gempa.Jam}`, inline: true },
                    { name: 'Magnitude', value: `**${gempa.Magnitude} SR**`, inline: true },
                    { name: 'Depth', value: gempa.Kedalaman, inline: true },
                    { name: 'Location', value: gempa.Wilayah, inline: false },
                    { name: 'Tsunami Potential', value: gempa.Potensi, inline: false }
                )
                .setFooter({ text: 'Source: BMKG Indonesia' })
                .setTimestamp();

            await channel.send({ content: '⚠️ **New Earthquake Event Detected!**', embeds: [embed] });
        }
    } catch (error) {
        console.error('Error fetching BMKG data:', error.message);
    }
}

client.on('clientReady', () => {
    console.log(`✅ Bot successfully logged in as ${client.user.tag}`);
    checkBMKG();
    setInterval(checkBMKG, 3 * 60 * 1000); // Periodically check every 3 minutes
});

// ==========================================
// INTERACTIVE DASHBOARD COMPONENTS HELPER
// ==========================================
function getMainMenuComponents() {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('main_menu_select')
        .setPlaceholder('👇 Choose a feature or service here...')
        .addOptions([
            {
                label: 'Latest Earthquake Alert',
                description: 'Fetch real-time earthquake reports from BMKG',
                value: 'btn_gempa',
                emoji: '🚨'
            },
            {
                label: 'Search Anime Details',
                description: 'Lookup scores, episodes, and summaries',
                value: 'btn_search_anime',
                emoji: '🎌'
            },
            {
                label: 'Tech News Today',
                description: 'Read top 5 popular tech news headlines',
                value: 'btn_berita_tekno',
                emoji: '📰'
            },
            {
                label: 'Search Specific News',
                description: 'Find news articles by custom query',
                value: 'btn_search_berita',
                emoji: '🔍'
            },
            {
                label: 'Steam Game Lookup',
                description: 'Check PC hardware specs & Steam pricing',
                value: 'btn_search_game',
                emoji: '🎮'
            },
            {
                label: 'Commodity Price Scraper',
                description: 'Fetch regional market prices for basic food items',
                value: 'btn_search_harga',
                emoji: '🛒'
            }
        ]);

    const rowMenu = new ActionRowBuilder().addComponents(selectMenu);

    const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_gempa')
            .setLabel('Earthquake Info')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚨'),
        new ButtonBuilder()
            .setCustomId('btn_search_anime')
            .setLabel('Search Anime')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎌'),
        new ButtonBuilder()
            .setCustomId('btn_berita_tekno')
            .setLabel('Tech News')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📰'),
        new ButtonBuilder()
            .setCustomId('btn_search_harga')
            .setLabel('Food Prices')
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
// MESSAGE COMMAND HANDLER (PREFIX-BASED)
// ==========================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // COMMAND: !menu / !help / !start
    if (['help', 'menu', 'start'].includes(command)) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Interactive Multi-Utility Dashboard')
            .setDescription('Click any **Button** or select an option from the **Dropdown Menu** below to trigger features effortlessly!')
            .setColor('#5865F2')
            .setFooter({ text: 'Use the interactive components below for instant action' });

        return message.reply({ embeds: [embed], components: getMainMenuComponents() });
    }

    if (command === 'ping') {
        return message.reply(`🏓 Pong! Current latency: **${Date.now() - message.createdTimestamp}ms**`);
    }
});

// ==========================================
// INTERACTION HANDLER (BUTTONS, DROPDOWN, MODALS)
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // 1. SELECT MENU & BUTTON ACTIONS HANDLER
    if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const customId = interaction.isStringSelectMenu() ? interaction.values[0] : interaction.customId;

        // Action: Soft Restart Bot Connection + Auto-Restore Dashboard (Admin-Only)
        if (customId === 'btn_restart') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: '❌ You lack Administrator permissions to restart the bot!', 
                    flags: 64
                });
            }

            await interaction.reply({ 
                content: '🔄 **Restarting bot connection...** Please wait a few seconds!' 
            });

            console.log(`⚠️ Soft-restart initiated by ${interaction.user.tag}`);

            try {
                await client.destroy();
                await client.login(CONFIG.TOKEN);
                console.log('✅ Bot successfully re-logged in!');

                const restoredEmbed = new EmbedBuilder()
                    .setTitle('🤖 Interactive Multi-Utility Dashboard')
                    .setDescription('✅ **Bot successfully reconnected and is back online!**\n\nClick any **Button** or pick an option from the **Dropdown Menu** below to continue using features:')
                    .setColor('#00E676')
                    .setFooter({ text: 'Status: Online & Ready' });

                return interaction.editReply({ 
                    content: '', 
                    embeds: [restoredEmbed], 
                    components: getMainMenuComponents() 
                });

            } catch (err) {
                console.error('❌ Failed to restart bot:', err.message);
                return interaction.editReply({ 
                    content: '❌ Failed to restart bot connection.' 
                });
            }
        }

        // Action: Check Earthquake Data
        if (customId === 'btn_gempa') {
            await interaction.deferReply({ ephemeral: false });
            try {
                const { data } = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
                const gempa = data.Infogempa.gempa;

                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Latest Earthquake Report (BMKG)')
                    .setColor('#FF0000')
                    .setThumbnail(`https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`)
                    .addFields(
                        { name: '📅 Time', value: `${gempa.Tanggal} - ${gempa.Jam}`, inline: true },
                        { name: '💥 Magnitude', value: `**${gempa.Magnitude} SR**`, inline: true },
                        { name: '🌊 Depth', value: gempa.Kedalaman, inline: true },
                        { name: '📍 Location', value: `${gempa.Wilayah}\n(${gempa.Coordinates})`, inline: false },
                        { name: '🚨 Potential', value: `**${gempa.Potensi}**`, inline: false }
                    )
                    .setFooter({ text: 'Source: BMKG Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to fetch earthquake data.' });
            }
        }

        // Action Pop-Up Form: Search Anime
        if (customId === 'btn_search_anime') {
            const modal = new ModalBuilder()
                .setCustomId('modal_anime')
                .setTitle('🎌 Search Anime Details');

            const animeInput = new TextInputBuilder()
                .setCustomId('input_anime')
                .setLabel('Anime Title')
                .setPlaceholder('Example: Attack on Titan, Naruto, One Piece')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(animeInput));
            return interaction.showModal(modal);
        }

        // Action: Tech News Headlines
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
                    .setTitle('🌐 Top Technology News Headlines')
                    .setColor('#4285F4')
                    .setDescription(newsList.join('\n\n'))
                    .setFooter({ text: 'Source: Google News Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to fetch news headlines.' });
            }
        }

        // Action Pop-Up Form: Search Custom News Topic
        if (customId === 'btn_search_berita') {
            const modal = new ModalBuilder()
                .setCustomId('modal_berita')
                .setTitle('🔍 Search News Headlines');

            const queryInput = new TextInputBuilder()
                .setCustomId('input_query')
                .setLabel('News Keywords')
                .setPlaceholder('Example: AI, Nvidia, Esports, Crypto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(queryInput));
            return interaction.showModal(modal);
        }

        // Action Pop-Up Form: Search Steam Game
        if (customId === 'btn_search_game') {
            const modal = new ModalBuilder()
                .setCustomId('modal_game')
                .setTitle('🎮 Steam Game & Specs Lookup');

            const gameInput = new TextInputBuilder()
                .setCustomId('input_game')
                .setLabel('Game Title or Alias')
                .setPlaceholder('Example: GTA V, Cyberpunk 2077, CS2')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(gameInput));
            return interaction.showModal(modal);
        }

        // Action Pop-Up Form: Search Commodity Price
        if (customId === 'btn_search_harga') {
            const modal = new ModalBuilder()
                .setCustomId('modal_harga')
                .setTitle('🛒 Check Commodity Prices');

            const itemInput = new TextInputBuilder()
                .setCustomId('input_item')
                .setLabel('Food Commodity Item')
                .setPlaceholder('Example: Beras, Daging Ayam, Telur, Cabai')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const regionInput = new TextInputBuilder()
                .setCustomId('input_region')
                .setLabel('Region / Province (Optional)')
                .setPlaceholder('Example: Jawa Tengah, DKI Jakarta, Surabaya')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(itemInput),
                new ActionRowBuilder().addComponents(regionInput)
            );
            return interaction.showModal(modal);
        }
    }

    // 2. MODAL FORM SUBMISSION HANDLER
    if (interaction.isModalSubmit()) {
        
        // Anime Search Submission (Dual API Strategy: Jikan + Fallback to Kitsu)
        if (interaction.customId === 'modal_anime') {
            const query = interaction.fields.getTextInputValue('input_anime').trim();
            await interaction.deferReply();

            // Try Primary API: MyAnimeList (Jikan v4 API)
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
                            { name: 'EPISODES', value: `${anime.episodes || '??'} eps`, inline: true },
                            { name: 'SCORE', value: `⭐ ${anime.score || 'N/A'}`, inline: true },
                            { name: 'STATUS', value: anime.status || '-', inline: true },
                            { name: 'GENRES', value: anime.genres ? anime.genres.map(g => g.name).join(', ') : '-', inline: false },
                            { name: 'SYNOPSIS', value: anime.synopsis ? anime.synopsis.slice(0, 250) + '...' : 'No synopsis available.' }
                        )
                        .setFooter({ text: 'Source: MyAnimeList' });

                    return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
                }
            } catch (e) {
                console.log('Jikan API rate-limited or unavailable. Fallback to Kitsu API...');
            }

            // Fallback API: Kitsu.io API
            try {
                const { data } = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=1`);
                if (!data.data || data.data.length === 0) {
                    return interaction.editReply(`❌ Anime title **"${query}"** was not found!`);
                }

                const anime = data.data[0].attributes;
                const embed = new EmbedBuilder()
                    .setTitle(anime.canonicalTitle)
                    .setURL(`https://kitsu.io/anime/${data.data[0].id}`)
                    .setColor('#FF6B6B')
                    .setThumbnail(anime.posterImage ? anime.posterImage.medium : '')
                    .addFields(
                        { name: 'EPISODES', value: `${anime.episodeCount || '??'} eps`, inline: true },
                        { name: 'SCORE', value: `⭐ ${anime.averageRating ? (anime.averageRating / 20).toFixed(2) : 'N/A'}`, inline: true },
                        { name: 'STATUS', value: anime.status || '-', inline: true },
                        { name: 'SYNOPSIS', value: anime.synopsis ? anime.synopsis.slice(0, 250) + '...' : 'No synopsis available.' }
                    )
                    .setFooter({ text: 'Source: Kitsu.io' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to retrieve anime details.' });
            }
        }

        // Custom News Search Submission
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
                    .setTitle(`🌐 News Search: ${searchQuery.toUpperCase()}`)
                    .setColor('#4285F4')
                    .setDescription(newsList.join('\n\n'))
                    .setFooter({ text: 'Source: Google News Indonesia' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to search news headlines.' });
            }
        }

        // Steam Game Search Submission
        if (interaction.customId === 'modal_game') {
            const rawQuery = interaction.fields.getTextInputValue('input_game').toLowerCase().trim();
            const query = GAME_ALIASES[rawQuery] || rawQuery;
            await interaction.deferReply();

            try {
                const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=ID`;
                const { data: searchData } = await axios.get(searchUrl);

                if (!searchData.items || searchData.items.length === 0) {
                    return interaction.editReply(`❌ Game **"${query}"** was not found on Steam.`);
                }

                const appId = searchData.items[0].id;
                const detailUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=ID&l=english`;
                const { data: detailData } = await axios.get(detailUrl);
                const gameInfo = detailData[appId].data;

                // Format hardware specifications and sanitize HTML tags
                const parseCleanSpecs = (html) => {
                    if (!html) return 'Not available.';
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
                    return result.join('\n') || 'Not available.';
                };

                let minSpecs = parseCleanSpecs(gameInfo.pc_requirements?.minimum).slice(0, 990);
                let recSpecs = parseCleanSpecs(gameInfo.pc_requirements?.recommended).slice(0, 990);

                let hargaFormatted = gameInfo.is_free ? 'GRATIS / FREE' : (gameInfo.price_overview?.final_formatted || 'View on Steam');

                const embed = new EmbedBuilder()
                    .setTitle(`🎮 ${gameInfo.name}`)
                    .setURL(`https://store.steampowered.com/app/${appId}`)
                    .setColor('#1b2838')
                    .setThumbnail(gameInfo.header_image)
                    .addFields(
                        { name: '💰 PRICE', value: hargaFormatted, inline: true },
                        { name: '📅 RELEASE', value: gameInfo.release_date ? gameInfo.release_date.date : 'TBA', inline: true },
                        { name: '🎭 GENRE', value: gameInfo.genres ? gameInfo.genres.map(g => g.description).join(', ') : '-', inline: true },
                        { name: '💻 MINIMUM SPECS', value: minSpecs, inline: false },
                        { name: '🚀 RECOMMENDED SPECS', value: recSpecs, inline: false }
                    )
                    .setFooter({ text: 'Data sourced directly from Steam Store' });

                return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to retrieve game specs from Steam.' });
            }
        }

        // Commodity Price Scraper Submission
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
                    const source = $(el).find('source').text().trim() || 'Market Watch';
                    
                    const priceMatch = title.match(/Rp\s*[\d\.\,]+\s*(ribu|rb|juta|jt)?/gi);

                    if (priceMatch) {
                        let formattedPrices = priceMatch.map(p => {
                            let clean = p.replace(/\s+/g, ' ').trim();
                            // Parse 'ribu / rb' strings into full numeric currency formats
                            if (/ribu|rb/i.test(clean)) {
                                let numStr = clean.replace(/Rp\s*/i, '').replace(/ribu|rb/i, '').trim().replace(',', '.');
                                let val = parseFloat(numStr) * 1000;
                                if (!isNaN(val)) return `Rp ${val.toLocaleString('id-ID')}`;
                            }
                            // Parse 'juta / jt' strings into full numeric currency formats
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
                        .setTitle(`🛒 Real-Time Commodity Price Scraper`)
                        .setColor('#00E676')
                        .addFields(
                            { name: '📍 Region', value: regionQuery.toUpperCase(), inline: true },
                            { name: '🌾 Commodity', value: itemQuery.toUpperCase(), inline: true },
                            { name: '💰 Price Reports', value: uniqueResults.join('\n\n'), inline: false }
                        )
                        .setFooter({ text: 'Data scraped from regional market report feeds' });

                    return interaction.editReply({ embeds: [embed], components: getMainMenuComponents() });
                }

                return interaction.editReply({ content: `❌ Specific price report for **"${itemQuery}"** in **${regionQuery.toUpperCase()}** was not found.` });
            } catch (err) {
                return interaction.editReply({ content: '❌ Failed to scrape commodity prices.' });
            }
        }
    }
});

// ==========================================
// GLOBAL CRASH HANDLERS (ALWAYS-ON PROTECTION)
// ==========================================

// Catch unhandled promise rejections (e.g., network timeouts or API errors)
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRASH PREVENTED] Unhandled Rejection:', reason);
});

// Catch uncaught exceptions to prevent total bot crashes
process.on('uncaughtException', (err, origin) => {
    console.error('⚠️ [CRASH PREVENTED] Uncaught Exception:', err);
});

// Monitor uncaught exceptions
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('⚠️ [CRASH PREVENTED] Exception Monitor:', err);
});

// Log Discord client errors without exiting process
client.on('error', (error) => {
    console.error('⚠️ [DISCORD CLIENT ERROR]:', error.message);
});

// Connect and log into Discord
client.login(CONFIG.TOKEN);
