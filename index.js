// index.js

// Import necessary classes from discord.js
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    PermissionsBitField,
    ChannelType,
    SlashCommandBuilder,
    MessageFlags,
    codeBlock,
} = require("discord.js");
const fetch = require('node-fetch'); // Import node-fetch for API requests
const fs = require('fs').promises; // For file operations (transcript)
const path = require('path');
require('dotenv').config();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Using client.once("ready", ...) as recommended by discord.js v13+
client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Register slash commands globally (or per guild for faster updates during development)
    const commands = [
        new SlashCommandBuilder()
            .setName('adduser')
            .setDescription('Adds a user to the current middleman ticket.')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('The user to add to the ticket')
                    .setRequired(true))
            .toJSON(),
        // NEW: /close slash command
        new SlashCommandBuilder()
            .setName('close')
            .setDescription('Closes the current middleman ticket.')
            .toJSON(),
    ];

    // For testing in a specific guild (replace 'YOUR_GUILD_ID' with your actual Guild ID for testing slash commands)
    const guildId = '1391659451454324857'; // YOUR GUILD ID FILLED IN HERE
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        await guild.commands.set(commands);
        console.log(`Registered ${commands.length} slash commands for guild ${guild.name}.`);
    } else {
        console.warn(`Guild with ID ${guildId} not found. Slash commands might not be registered.`);
    }
});

// Shared assets
const giflink = "https://cdn.discordapp.com/attachments/1395238374821990636/1413382947054026793/a_d6d5ee60cc395389327eb899a67064a7.gif?ex=68bdb531&is=68bc63b1&hm=5c68ad1bc81be55e09bfcaf7fae80b323bd25727af2de72281fa7b9881cc44dd&";
const robloxapiicon = giflink;

// Store states for each .Mminfo interaction
const mminfoStates = new Collection();
// Store states for each .Mmfee interaction
const mmfeeStates = new Collection();
// Store thread information by channel ID (no longer needed, but keeping for reference)
const activeThreads = new Collection();

// Define the required role ID (Middleman role)
const required_role_id = '1412272828019118202';
const ticket_category_id = '1412998524756295705'; // YOUR TICKET CATEGORY ID FILLED IN HERE
const log_channel_id = '1412272906381164557'; // Channel to send ticket logs

// Helper function to check permissions
const hasPermission = (member) => {
    // Check if the member has the specific role or administrator permission
    return member.roles.cache.has(required_role_id) || member.permissions.has(PermissionsBitField.Flags.Administrator);
};

// Helper function to find the ticket creator from channel topic
const getTicketCreatorId = (topic) => {
    if (!topic) return null;
    const match = topic.match(/Creator: <@!(\d+)>/);
    return match ? match[1] : null;
};

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Command 1: .Buying
    if (command === "buying") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Sell Your Items**")
            .setDescription("### Buying your Adopt Me / PS99 / MM2 / Blade Ball / Pets Go / Limited items / Robux\n\n" +
                "`・` __**Adopt Me**__ 🐾\n" +
                "> Only buying pets better than a turtle or arctic reindeer.\n\n" +
                "`・` __**Pet Simulator 99**__ 💎\n" +
                "> Only buying Titanics.\n\n" +
                "`・` __**Murder Mystery 2**__ ⚔️\n" +
                "> Only buying high tier items in MM2 such as: Harvester, Icepiercer, Gingerscope, Sakura Set, Evergreen, Bat, a lot of Godlys etc.\n\n" +
                "`・` __**Blade Ball**__ 🗝️\n" +
                "> Only buying items that have 5k+ RAP or 5k+ tokens.\n\n" +
                "`・` __**Limiteds**__ ✨\n" +
                "> Only buying 5k+ valued limiteds.\n\n" +
                "`・` __**Pets Go**__ 🎉\n" +
                "> Only buying Huges/Pets/Gems that have over 500m value.\n\n" +
                "`・` __**Example Payment Methods**__ 💸\n" +
                "  <:crypto:1412555870273016029> <:robux:1412556385450983485> <:visa:1412556121880793230> <:creditcard:1412556170190782557> or any kind of worldwide banks.\n\n" +
                "> If you can't see your payment method above, direct message me about it and we will check if we can do that.\n\n" +
                "### `・`  **Only DM <1061333704347226202> and <904989203480322090>**")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 2: .Trade
    if (command === "trade") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Trade With Me**")
            .setDescription("### Trading for your Adopt Me / PS99 / MM2 / Blade Ball / Pets Go / Limited items / Robux\n\n" +
                "`・` __**Adopt Me**__ 🐾\n" +
                "> I can offer MM2/PS99/Blade Ball/Pets Go for your Adopt Me\n" +
                "> Requirements: Only offering for Turtle or better pets.\n\n" +
                "`・` __**Murder Mystery 2**__ ⚔️\n" +
                "> I can offer PS99/Adopt Me/Pets Go/Blade Ball for your MM2\n" +
                "> Requirements: Only offering for high tiers such as: Harvesters, Icepiercers, Travelers Axe etc.\n\n" +
                "`・` __**Pet Simulator 99**__ 💎\n" +
                "> I can offer Adopt Me/MM2/Blade Ball/Pets Go for your PS99\n" +
                "> Requirements: Only offering for 10 Huges or more.\n" +
                "> Only offering for 1B+ RAP or more worth of stuff.\n\n" +
                "`・` __**Pets Go**__ 🎉\n" +
                "> I can offer PS99/Adopt Me/MM2/Blade Ball\n" +
                "> Requirements: Only offering for 1B+ RAP\n\n" +
                "`・` __**Limiteds**__ ✨\n" +
                "> I can offer Adopt Me/MM2/PS99/Pets Go/Blade Ball for your Limiteds.\n" +
                "> Requirements: 5k+ value only.\n\n" +
                "`・` __**My Offers**__ 💸\n" +
                "> Can offer Royale High/Pets Go/Blade Ball/PS99/Adopt Me/MM2 for all those above.\n\n" +
                "### `・` **Only DM <1061333704347226202> and <904989203480322090>**")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 3: .Rules
    if (command === "rules") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Rules**")
            .setDescription("`・` __**Follow Discord TOS and Guidelines**__\n" +
                "> We're on Discord's platform, therefore we'll automatically follow their regulations. Make sure you don't violate their terms and guidelines.\n\n" +
                "`・` __**Personal Information**__\n" +
                "> Do not post personal information about anyone without their consent. Any impersonation within MMs or other members are also not allowed.\n\n" +
                "`・` __**Channel Misusage**__\n" +
                "> Use channels to their purpose. Don't create MM or report tickets for questions instead a moderator or management member for any needed help.\n\n" +
                "`・` __**Malicious Activities**__\n" +
                "> Do not use this server for any malicious activities such as fraud, cookie-logging or IP grabbing, etc. It is strictly not allowed.\n\n" +
                "`・` __**Trading and Advertising**__\n" +
                "> DM advertising or promoting of any sort is prohibited. If you'd like to buy an ad - directly message <1061333704347226202> as for trading, head up to <#1412272945828597770>\n\n" +
                "`・` __**Additional Notes**__\n" +
                "> Regulations can be changed any time without announcements. Have common sense, don't be disrespectful or toxic. Keep this server clean.")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Discord TOS")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/terms"),
            new ButtonBuilder()
                .setLabel("Discord Guidelines")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/guidelines")
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    // Command 4: .About
    if (command === "about") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | About Us**")
            .setDescription("> `・` Welcome to Trade Haven official server, a safe and secure middleman service, with trusted members of the Roblox community to ensure your deals are fast and safe as can be.\n\n" +
                "> `・` We offer secure transactions for your Roblox items with experienced, hand-picked middlemen all across the globe. Here, we prioritize safety and satisfaction, ensuring a worry-free experience for both buyers and sellers.\n\n" +
                "> `・` Our dedicated team holds digital goods until payment is 100% verified, releasing them promptly to guarantee a scam-free environment.\n\n" +
                "> `・` We middleman all things digital, from Roblox Limiteds to in-game items from any game with a trading feature implemented, such as Adopt Me, MM2, Da Hood, and more! Check out the <#1412272897652686958> channel for more detailed info.")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Middleman")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.com/channels/1391659451454324857/1412272897652686958")
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    // Command 5: .Values
    if (command === "values") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Values**")
            .setDescription("> `・` **MM2** : [MM2 Values](https://www.mm2values.com/) : In-game values for **Murder Mystery 2**\n\n" +
                "> `・` **Adopt Me** : [Adopt Me Values](https://adoptmevalues.gg/) : In-game values for **Adopt Me**\n\n" +
                "> `・` **PS99** / **Pets Go** : [Pet Simulator Values](https://petsimulatorvalues.com/) : In-game values for **PS99** and **Pets Go**\n\n" +
                "> `・` We are partnered with **MM2Values**, **AdoptMeValues**, and **Cosmic Values**. Click the links shown above to be redirected to their websites.")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("MM2 Values")
                .setStyle(ButtonStyle.Link)
                .setURL("https://www.mm2values.com/"),
            new ButtonBuilder()
                .setLabel("Adopt Me Values")
                .setStyle(ButtonStyle.Link)
                .setURL("https://adoptmevalues.gg/"),
            new ButtonBuilder()
                .setLabel("PS99 / Pets Go Values")
                .setStyle(ButtonStyle.Link)
                .setURL("https://petsimulatorvalues.com/")
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    // Command 6: .Hitrules
    if (command === "hitrules") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Hitter Rules**")
            .setDescription("> `1.` All hits must be posted to the daily channel with calculated balance.\n\n" +
                "> `2.` Do not go overlimit without permission from <1061333704347226202>.\n\n" +
                "> `3.` Do not spam ping any <&1412272818271289455> or higher roles for unimportant reasons.\n\n" +
                "> `4.` Do not try hitting anyone in a group chat, you may only hit in ticket channels.\n\n" +
                "> `5.` Do not try and steal hits/tickets from other hitters/middlemen.\n\n" +
                "> `6.` Do not discuss about hitting in tickets unless the code is mentioned.\n\n" +
                "> `7.` Do not try and sell your role to others.\n\n" +
                "> `8.` Do not try and get personal hitter.\n\n" +
                "> `9.` Do not scam hitters.\n\n" +
                "> `10.` Remember to hire after getting a hit.\n\n" +
                "> `11.` Do not claim more tickets than you have assigned.\n\n" +
                "> `12.` If you got middleman for alt hits only do not MM normal tickets.\n\n" +
                "------------------------------------------\n\n" +
                "All middlemen must follow these rules, failing to do so may result in a ban or demote.")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 7: .Hithelp
    if (command === "hithelp") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Hit Help**")
            .setDescription("> **Methods to help you get hits**\n\n" +
                "__**MM2 Method**__\n" +
                "Just like Adopt Me method but a bit different, if someone is trading like a Harv offer like 10+ smalls, you need to do this because in MM2 you can only trade 4 guns / knives at a time\n\n" +
                "```Example:```\n\n" +
                "**Me** - Hey can I offer for your Harv?\n\n" +
                "**Them** - Sure\n\n" +
                "**Me** - Would you take like 15 smalls? They add up to 900 value\n\n" +
                "**Them** - Sure\n\n" +
                "**Me** - Alright can we use middleman?\n\n" +
                "**Them** - Sure\n\n" +
                "> Then just send them this server link to scam their ass\n\n" +
                "__**PS99 and Pets Go Method**__\n" +
                "**LF Titanics/Huges/Exclusive Pets**\n\n\n" +
                "**DMs:**\n" +
                "> Do you take cash/Robux by any chance for the (pet name)?")
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 8: .Hitguide
    if (command === "hitguide") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Hit Guide**")
            .setDescription(
                "> `・` **How to be a Hitter (Server Edition):**\n\n" +
                "> `1.` Join popular trading servers and offer/buy items.\n" +
                "> `2.` (You can find trading servers here <#1412272942888517672>)\n" +
                "> `3.` Start a deal by messaging someone or replying to DMs.\n" +
                "> `4.` Negotiate a cross-trade or any high-value trade.\n" +
                "> `5.` Recommend using our middleman service for safety and trust.\n" +
                "> `6.` Once the trade is confirmed, let us handle the rest. And if we manage to hit (scam) then we will split 50% with you\n\n" +
                "> `・` **How to be a Middleman (Server Edition):**\n\n" +
                "> `1.` Optional: If you want to become a middleman yourself, get the role to help with trades (or use an alt to hit).\n" +
                "> `2.` Check here <#1412272931370700903>\n" +
                "> `3.` What's the difference between hit and alt hit\n" +
                "> `4.` Hit means you find a victim send our MM server and make ticket from <#1412272897652686958> request then MM will handle\n" +
                "> `5.` Alt hit means your main account is middleman (MM) and your alt is for finding victims once you get the hit you don't have to split anything because you hit the guy by yourself.\n"
            )
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 9: .Mminfo
    if (command === "mminfo") {
        // Permission check for .Mminfo
        if (!message.member || !hasPermission(message.member)) {
            return message.reply({ content: "❌ - You do not have permission to use this command.", flags: [MessageFlags.Ephemeral] });
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle("Middleman Info & Explanation")
            .setDescription(
                "> `・` *Middleman (MM) is a trusted person with many vouches who helps transactions go smoothly without scams.*\n" +
                ">\n" +
                "> `・` __**Example: Trade is NFR Crow for Robux.**__\n\n" +
                codeBlock("css", `The Middleman will hold the NFR Crow. After the middleman gets the NFR Crow in their inventory, they will tell the buyer and show the buyer proof they have the NFR Crow, then the buyer will pay the Robux to the seller. Once the buyer has paid and the seller has confirmed that they got it, the middleman will give the NFR Crow to the buyer.`) +
                "\n"
            )
            .setImage("https://cdn.discordapp.com/attachments/1412272937603694653/1415146098963513364/B4D311C6-BEB0-4F4D-A979-C22FFE661D6B-2-1.webp?ex=68c22502&is=68c0d382&hm=3b1e3bc8c034c412becc1fbf45238c762498b1b464f42349b479d13a57e31e8c&")
            .setColor(0x90ee90)
            .setFooter({ text: "Please click the button below, depending if you understand or not" });

        const initialRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mm_understand")
                .setLabel("✅ I understand")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("mm_notunderstand")
                .setLabel("❌ I don't understand")
                .setStyle(ButtonStyle.Danger)
        );

        const sentMessage = await message.channel.send({ embeds: [initialEmbed], components: [initialRow] });

        mminfoStates.set(sentMessage.id, {
            understoodUsers: new Set(),
            notUnderstoodUsers: new Set(),
        });

        const collector = sentMessage.createMessageComponentCollector();

        collector.on("collect", async (interaction) => {
            const state = mminfoStates.get(sentMessage.id);
            if (!state) {
                await interaction.reply({ content: "This interaction has expired or is no longer active.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            const userId = interaction.user.id;

            if (interaction.customId === "mm_understand") {
                if (state.understoodUsers.has(userId)) {
                    await interaction.reply({ content: "You've already indicated you understand.", flags: [MessageFlags.Ephemeral] });
                    return;
                }

                await interaction.deferUpdate();

                state.understoodUsers.add(userId);
                state.notUnderstoodUsers.delete(userId);

                await interaction.followUp({ content: `✅ <@${userId}> understands how the middleman works.`, flags: [MessageFlags.Ephemeral] });

                if (state.understoodUsers.size >= 2) {
                    const userArray = Array.from(state.understoodUsers).map(id => `<@${id}>`).join(' and ');
                    await interaction.message.channel.send(`✅ ${userArray} both parties understand how the MM process works.`);
                    collector.stop('understood_by_two');
                }
            } else if (interaction.customId === "mm_notunderstand") {
                if (state.notUnderstoodUsers.has(userId)) {
                    await interaction.reply({ content: "You've already indicated you don't understand. Please ask your MM.", flags: [MessageFlags.Ephemeral] });
                    return;
                }

                await interaction.deferUpdate();

                state.notUnderstoodUsers.add(userId);
                state.understoodUsers.delete(userId);

                await interaction.followUp({ content: `❌ <@${userId}> doesn't understand. Please ask your middleman to learn.`, flags: [MessageFlags.Ephemeral] });
            }
        });

        collector.on("end", async (collected, reason) => {
            console.log(`Collector ended for message ${sentMessage.id}. Reason: ${reason}`);
            mminfoStates.delete(sentMessage.id);
            if (sentMessage.editable && reason !== 'understood_by_two') {
                await sentMessage.edit({ components: [] }).catch(console.error);
            }
        });
    }

    // Command 10: .Form
    if (command === "form") {
        const embed = new EmbedBuilder()
            .setTitle("**Trade Haven | Pre-Trade Questions**")
            .setDescription(
                "**Before doing the trade, both of the traders must first answer these questions:**\n\n" +
                "`1.` What are your Roblox usernames?\n" +
                "`2.` Can you join private servers through links?\n\n" +
                "*Once both users are done answering, you may now __ping__ the middleman **once**.*"
            )
            .setColor(0x90ee90)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [embed] });
    }

    // Command 11: .Mmfee
    if (command === "mmfee") {
        // Permission check for .Mmfee
        if (!message.member || !hasPermission(message.member)) {
            return message.reply({ content: "❌ - You do not have permission to use this command.", flags: [MessageFlags.Ephemeral] });
        }

        const mmfeeEmbed = new EmbedBuilder()
            .setTitle("Middleman Fee")
            .setDescription(
                ">>> Thank you for using our services! \n" +
                "Your items are currently being held for the time being.\n\n" +
                "To proceed with the trade, please make the necessary donation that the MM deserves. \n" +
                ">>> ```\n" +
                "Please be patient while a MM will list a price!\n" +
                "Discuss with your trader about how you would want to pay the fee.\n\n" +
                "Users are able to split the fee or manage to pay the full fee if possible. (Once clicked, you can't redo!)\n" +
                "```"
            )
            .setColor(0x90ee90)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        const mmfeeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("mmfee_50_50")
                .setLabel("50/50")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("mmfee_100_percent")
                .setLabel("I'm Paying 100%")
                .setStyle(ButtonStyle.Success)
        );

        const sentMessage = await message.channel.send({ embeds: [mmfeeEmbed], components: [mmfeeRow] });

        mmfeeStates.set(sentMessage.id, {
            clickedUsers: new Set(),
        });

        const collector = sentMessage.createMessageComponentCollector({ time: 600000 });

        collector.on("collect", async (interaction) => {
            const state = mmfeeStates.get(sentMessage.id);
            if (!state) {
                await interaction.reply({ content: "This interaction has expired or is no longer active.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            const userId = interaction.user.id;

            if (state.clickedUsers.has(userId)) {
                await interaction.reply({ content: "You have already made a choice for this fee. (Once clicked, you can't redo!)", flags: [MessageFlags.Ephemeral] });
                return;
            }

            state.clickedUsers.add(userId);

            if (interaction.customId === "mmfee_50_50") {
                await interaction.reply({ content: `<@${userId}> clicked "**50/50**" button and you will both pay fee in 50/50.`, flags: [MessageFlags.Ephemeral] });
            } else if (interaction.customId === "mmfee_100_percent") {
                await interaction.reply({ content: `<@${userId}> clicked "**I'm Paying 100%**" button and will cover 100% of the fee.`, flags: [MessageFlags.Ephemeral] });
            }
        });

        collector.on("end", async (collected, reason) => {
            console.log(`Collector ended for message ${sentMessage.id}. Reason: ${reason}`);
            mmfeeStates.delete(sentMessage.id);
            if (sentMessage.editable) {
                await sentMessage.edit({ components: [] }).catch(console.error);
            }
        });
    }

    // Command 12: .Roblox <username>
    if (command === "roblox") {
        const robloxUsername = args[0];
        if (!robloxUsername) {
            return message.reply("Please provide a Roblox username. Usage: `.Roblox <username>`");
        }

        let userId = null;
        let actualUsername = robloxUsername;

        try {
            // Attempt 1: try to get user id by exact username using post endpoint
            const exactUsernameResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usernames: [robloxUsername],
                    excludeBannedUsers: true
                })
            });
            const exactUsernameData = await exactUsernameResponse.json();

            if (exactUsernameData.data && exactUsernameData.data.length > 0) {
                userId = exactUsernameData.data[0].id;
                actualUsername = exactUsernameData.data[0].name;
            } else {
                // Attempt 2: fallback to the search endpoint if exact lookup fails
                const searchResponse = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(robloxUsername)}&limit=1`);
                const searchData = await searchResponse.json();

                if (searchData.data && searchData.data.length > 0) {
                    userId = searchData.data[0].id;
                    actualUsername = searchData.data[0].name;
                }
            }

            if (!userId) {
                return message.reply(`❌ Could not find a Roblox user matching \`${robloxUsername}\`. Please double-check the spelling.`);
            }

            // --- If we reached here, we successfully got a userId ---

            // Step 3: Get detailed user info using the user id
            const userInfoResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            const userData = await userInfoResponse.json();

            if (!userData || userData.errors) {
                console.error("Roblox user info API error:", userData.errors);
                // If the user data fails after getting an id, it's a deeper API issue
                return message.reply("Failed to fetch detailed Roblox user information after finding the user. The Roblox API might be temporarily unavailable.");
            }

            // Step 4: Get the user's full avatar (bust or full-body)
            // Using avatar-bust for a more complete image than headshot, adjust size as needed
            const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=png&isCircular=false`);
            const avatarData = await avatarResponse.json();
            const avatarUrl = (avatarData.data && avatarData.data.length > 0) ? avatarData.data[0].imageUrl : null;

            // Format creation date
            const createdDate = new Date(userData.created);
            // Example: 3/23/2024, 5:47 pm
            const formattedCreatedDate = createdDate.toLocaleDateString('en-us', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            // Calculate "x years/months/days ago"
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let timeAgo;
            if (diffDays < 30) {
                timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30.44);
                timeAgo = `${months} month${months !== 1 ? 's' : ''} ago`;
            } else {
                const years = Math.floor(diffDays / 365.25);
                timeAgo = `${years} year${years !== 1 ? 's' : ''} ago`;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Roblox Info: ${actualUsername}`)
                .setThumbnail(avatarUrl)
                .setColor(0x90ee90)
                .addFields(
                    { name: 'Username', value: actualUsername, inline: false },
                    { name: 'Display Name', value: userData.displayName, inline: false },
                    { name: 'User ID', value: userData.id.toString(), inline: false },
                    { name: 'Created', value: `${formattedCreatedDate}\n(${timeAgo})`, inline: false }
                )
                .setFooter({ text: "Data downloaded from Roblox API", iconURL: robloxapiicon });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Profile Link")
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/${userData.id}/profile`)
            );

            await message.channel.send({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error("An error occurred while fetching Roblox user data:", error);
            await message.reply("An unexpected error occurred while trying to fetch Roblox user data. Please ensure the Roblox API is accessible and try again.");
        }
    }

    // New command: .Received
    if (command === "received") {
        // Permission check for .Received (assuming it also requires the same role)
        if (!message.member || !hasPermission(message.member)) {
            return message.reply({ content: "❌ - You do not have permission to use this command.", flags: [MessageFlags.Ephemeral] });
        }

        const receivedEmbed = new EmbedBuilder()
            .setTitle("Successfully Received Items!")
            .setDescription(
                "**> The item has been received. You may now proceed with the rest of the trade and then ping the middleman once done.**"
            )
            .setColor(0x90ee90)
            .setFooter({ text: "Trade Haven © 2025", iconURL: giflink });

        await message.channel.send({ embeds: [receivedEmbed] });
    }

    // Command: .sendticketpanel
    if (command === "sendticketpanel") {
        // Only allow administrators or specific roles to send the ticket panel
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !message.member.roles.cache.has(required_role_id)) {
            return message.reply({ content: "❌ - You do not have permission to send the ticket panel.", flags: [MessageFlags.Ephemeral] });
        }

        const ticketPanelEmbed = new EmbedBuilder()
            .setTitle("Trade Haven | Middleman Request")
            .setDescription(
                "> `・` Welcome to Trade Haven server, a safe and secure middleman service, with trusted members of the Roblox community to ensure your deals are fast and safe as can be.\n\n" +
                "> `・` We offer secure transactions for your Roblox items with experienced, hand-picked middlemen all across the globe. Here, we prioritize safety and satisfaction, ensuring a worry-free experience for both buyers and sellers.\n\n" +
                "> `・` Our dedicated team holds digital goods until payment is 100% verified, releasing them promptly to guarantee a scam-free environment.\n\n" +
                "> `・` We middleman all things digital, from Roblox Limiteds to in-game items from any game with a trading feature implemented, such as Adopt Me, MM2, Da Hood, and more! Check out <#1412272896180748308> channel for more detailed info."
            )
            .setColor(0x90ee90)
            .setImage(giflink)
            .setThumbnail(giflink)
            .setFooter({ text: "Trade Haven - Ticket Panel & System", iconURL: giflink });

        const ticketPanelRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("request_middleman_ticket")
                .setLabel("Request Middleman")
                .setEmoji("1415177140478935181")
                .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [ticketPanelEmbed], components: [ticketPanelRow] });
        await message.delete();
    }
});

// Interaction handling for buttons and slash commands
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'request_middleman_ticket') {
            const guild = interaction.guild;
            const member = interaction.member;

            // Ensure a category ID is set
            if (!ticket_category_id || !guild.channels.cache.get(ticket_category_id)) {
                await interaction.reply({ content: "Ticket category not configured or found. Please contact an administrator.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            // Create a new ticket channel
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '')}`, // Sanitize username
                type: ChannelType.GuildText,
                parent: ticket_category_id,
                topic: `Creator: <@!${member.id}>`, // Set topic to store creator's ID
                permissionOverwrites: [
                    {
                        id: guild.id, // @everyone role
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id, // User who created the ticket
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: required_role_id, // Middleman role
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                ],
            });

            // Create the "Claim Ticket" button
            const claimButton = new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('🙋‍♂️ Claim') // Use the emoji here
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(claimButton);

            const initialMessage = await ticketChannel.send({
                content: `<@${member.id}>, <@&${required_role_id}>: **Ty For Using Trade Haven MM, A Middlemen Will Be With U Soon.**`,
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`Your Middleman Request Has Been Created! Please Explain Your Trade Details Here.`)
                        .setColor(0x90ee90)
                ],
                components: [row]
            });

            await interaction.reply({ content: `✅ Your Middleman Ticket Has Been Created: ${ticketChannel}`, flags: [MessageFlags.Ephemeral] });

        } else if (interaction.customId === 'claim_ticket') {
            // Logic for the Claim Ticket button
            const member = interaction.member;
            const ticketChannel = interaction.channel;

            if (!hasPermission(member)) {
                await interaction.reply({ content: "❌ - You do not have permission to claim this ticket.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            // Check if the button is already disabled by checking the original message's components
            const originalComponents = interaction.message.components;
            if (originalComponents.length > 0 && originalComponents[0].components[0].disabled) {
                await interaction.reply({ content: "❌ This ticket has already been claimed.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            // Acknowledge the button click and edit the original message
            await interaction.deferUpdate();

            // Get the ticket creator from the channel topic
            const creatorId = getTicketCreatorId(ticketChannel.topic);

            // Create the new green embed
            const claimedEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`Claimed by <@${interaction.user.id}>`);

            // Edit the original message to show the claimed embed and remove the buttons
            await interaction.message.edit({
                content: `Claimed by <@${interaction.user.id}>`,
                embeds: [claimedEmbed],
                components: []
            });

            // Lock the channel permissions
            try {
                // Deny view access for @everyone
                await ticketChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: false,
                });

                // Allow access for the ticket opener
                if (creatorId) {
                    await ticketChannel.permissionOverwrites.edit(creatorId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                    });
                }

                // Allow access for the claiming MM
                await ticketChannel.permissionOverwrites.edit(member.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                });

                // Send a message in the channel confirming the claim and the lock
                await ticketChannel.send(`✅ <@${member.id}> has claimed this ticket. The channel is now locked to all members except the ticket creator and the claiming middleman.`);

            } catch (error) {
                console.error("Error setting permissions after claim:", error);
                await ticketChannel.send(`❌ An error occurred while trying to set channel permissions. Please check the bot's role hierarchy and permissions.`);
            }

        } else if (interaction.customId.startsWith("mm_")) { // Existing .Mminfo button handling
            const state = mminfoStates.get(interaction.message.id);
            if (!state) {
                await interaction.reply({ content: "This interaction has expired or is no longer active.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            const userId = interaction.user.id;

            if (interaction.customId === "mm_understand") {
                if (state.understoodUsers.has(userId)) {
                    await interaction.reply({ content: "You've already indicated you understand.", flags: [MessageFlags.Ephemeral] });
                    return;
                }
                await interaction.deferUpdate();
                state.understoodUsers.add(userId);
                state.notUnderstoodUsers.delete(userId);
                await interaction.followUp({ content: `✅ <@${userId}> understands how the middleman works.`, flags: [MessageFlags.Ephemeral] });
                if (state.understoodUsers.size >= 2) {
                     const userArray = Array.from(state.understoodUsers).map(id => `<@${id}>`).join(' and ');
                }
            } else if (interaction.customId === "mm_notunderstand") {
                if (state.notUnderstoodUsers.has(userId)) {
                    await interaction.reply({ content: "You've already indicated you don't understand. Please ask your MM.", flags: [MessageFlags.Ephemeral] });
                    return;
                }
                await interaction.deferUpdate();
                state.notUnderstoodUsers.add(userId);
                state.understoodUsers.delete(userId);
                await interaction.followUp({ content: `❌ <@${userId}> doesn't understand. Please ask your middleman to learn.`, flags: [MessageFlags.Ephemeral] });
            }
        }
    } else if (interaction.isCommand()) { // Handle slash commands
        if (interaction.commandName === 'adduser') {
            const ticketChannel = interaction.channel;

            // Check if the command is used in a ticket channel
            if (!ticketChannel.name.startsWith('ticket-')) {
                return interaction.reply({ content: "This command can only be used in a middleman ticket channel.", flags: [MessageFlags.Ephemeral] });
            }

            // Check if the user executing the command has the required role (Middleman)
            if (!hasPermission(interaction.member)) {
                return interaction.reply({ content: "❌ - You do not have permission to add users to tickets.", flags: [MessageFlags.Ephemeral] });
            }

            const targetUser = interaction.options.getUser('target');

            try {
                // Add the user to the main ticket channel
                await ticketChannel.permissionOverwrites.edit(targetUser.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                await interaction.reply({ content: `✅ <@${targetUser.id}> has been added to this ticket.`, flags: [MessageFlags.Ephemeral] });
            } catch (error) {
                console.error("Error adding user to ticket:", error);
                await interaction.reply({ content: `❌ Failed to add <@${targetUser.id}> to the ticket. Please ensure the bot has necessary permissions.`, flags: [MessageFlags.Ephemeral] });
            }
        } else if (interaction.commandName === 'close') { // /close command handler
            const ticketChannel = interaction.channel;

            // Check if the command is used in a ticket channel
            if (!ticketChannel.name.startsWith('ticket-')) {
                return interaction.reply({ content: "This command can only be used in a middleman ticket channel.", flags: [MessageFlags.Ephemeral] });
            }

            // Check if the user executing the command has the required role (Middleman)
            if (!hasPermission(interaction.member)) {
                return interaction.reply({ content: "❌ - You do not have permission to close tickets.", flags: [MessageFlags.Ephemeral] });
            }

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const logChannel = client.channels.cache.get(log_channel_id);

            if (!logChannel) {
                console.error(`Log channel with ID ${log_channel_id} not found.`);
                return interaction.editReply({ content: "❌ Log channel not found. Please contact an administrator.", flags: [MessageFlags.Ephemeral] });
            }

            try {
                let transcript = `Ticket Transcript for #${ticketChannel.name}\nCreator: ${ticketChannel.topic || 'Unknown'}\nClosed by: ${interaction.user.tag}\nDate: ${new Date().toLocaleString()}\n\n`;

                // Fetch messages from the main ticket channel
                const mainChannelMessages = await ticketChannel.messages.fetch({ limit: 100 }); // Fetch last 100 messages
                const sortedMainMessages = mainChannelMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                transcript += "--- Main Channel Messages ---\n\n";
                sortedMainMessages.forEach(msg => {
                    transcript += `${new Date(msg.createdTimestamp).toLocaleString()} | ${msg.author.tag}: ${msg.content}\n`;
                    if (msg.attachments.size > 0) {
                        msg.attachments.forEach(attachment => {
                            transcript += `  Attachment: ${attachment.url}\n`;
                        });
                    }
                });

                // Send transcript to the log channel as a file
                const buffer = Buffer.from(transcript, 'utf-8');
                const fileAttachment = {
                    attachment: buffer,
                    name: `ticket-${ticketChannel.name}-transcript.txt`
                };

                await logChannel.send({
                    content: `Ticket #${ticketChannel.name} closed by <@${interaction.user.id}>. Transcript attached.`,
                    files: [fileAttachment]
                });

                await interaction.editReply({ content: `✅ Ticket #${ticketChannel.name} closed. Transcript sent to ${logChannel}. This channel will be deleted in 5 seconds.`, flags: [MessageFlags.Ephemeral] });

                // Delete the ticket channel and its thread after a delay
                setTimeout(async () => {
                    try {
                        await ticketChannel.delete('Ticket closed by middleman.');
                    } catch (err) {
                        console.error(`Failed to delete ticket channel ${ticketChannel.name}:`, err);
                        logChannel.send(`⚠️ Failed to delete ticket channel ${ticketChannel.name} after closing. Error: ${err.message}`).catch(console.error);
                    }
                }, 5000); // 5 seconds delay

            } catch (error) {
                console.error("Error closing ticket:", error);
                await interaction.editReply({ content: `❌ An error occurred while trying to close the ticket: ${error.message}`, flags: [MessageFlags.Ephemeral] });
            }
        }
    }
});

client.login(process.env.TOKEN);
