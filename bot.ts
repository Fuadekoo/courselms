import { PrismaClient } from "@prisma/client";
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  InlineKeyboard,
  Keyboard,
} from "grammy";
import dotenv from "dotenv";
import { normalizeUrl } from "./lib/utils/url";

dotenv.config();

const prisma = new PrismaClient();

export const bot = new Bot(process.env.BOT_TOKEN || "");

async function clearMsg(ctx: Context) {
  if (ctx.chat?.id && ctx.message) {
    for (let i = ctx.message.message_id; i >= 0; i--) {
      await ctx.api.deleteMessage(ctx.chat.id, i).catch(() => {
        return;
      });
    }
  }
}

async function sendCourses(chatId: number, ctx: Context) {
  const user = await prisma.user.findFirst({
    where: { chatId },
    select: { id: true, status: true },
  });
  if (user) {
    if (user.status == "active") {
      const orders = await prisma.order.findMany({
          where: { user: { chatId }, status: "paid" },
          select: {
            user: { select: { status: true } },
            course: {
              select: {
                titleAm: true,
                channel: { select: { chatId: true, title: true } },
              },
            },
          },
        }),
        inlineKeyboard = new InlineKeyboard();
      await Promise.all(
        orders.map(async ({ course: { titleAm, channel } }) => {
          if (channel) {
            inlineKeyboard
              .url(
                titleAm,
                await bot.api
                  .createChatInviteLink(Number(channel.chatId), {
                    member_limit: 1,
                  })
                  .then((res) => res.invite_link)
              )
              .row();
          }
          return;
        })
      );
      await ctx.reply(`${orders.length} የተመዘገቡት ትምህርት አለዎት`, {
        reply_markup: inlineKeyboard.webApp(
          `${orders.length > 0 ? "ተጨማሪ " : ""}ትምህርቶችን ይመልከቱ`,
          normalizeUrl(process.env.MAIN_API || "", `/course`)
        ),
      });
      return;
    } else {
      await ctx.reply(
        `
      Your account is temporarily inactive,\n Please contact the Support Center for more information\n\n
        መለያዎ ለጊዜው ኢ-ንቁ ሆኗል,\n ለበለጠ መረጃ እባክዎን የድጋፍ ማእከልን ያነጋግሩ
        `
      );
      return;
    }
  } else {
    await ctx.reply(`የተመዘገቡት ትምህርት የለምየለም`, {
      reply_markup: new InlineKeyboard().webApp(
        `ትምህርቶችን ይመልከቱ`,
        `${process.env.MAIN_API}/course`
      ),
    });
    return;
  }
}

export async function startBot() {
  await bot.api.setMyCommands([
    { command: "start", description: "ቦቱን ለማስጀመር " },
    { command: "course", description: "የትምህርት ዝርዝር " },
  ]);

  bot.command("start", async (ctx) => {
    await clearMsg(ctx);
    const user = await prisma.user.findFirst({
      where: { chatId: ctx.chat.id },
    });
    if (user) {
      ctx.reply(`እንኳን ወደ ዳሩልኩብራ ተመለሱ`, {
        reply_markup: new InlineKeyboard().text("ደርሶች", "course"),
      });
    } else {
      ctx.reply(`እንኳን ወደ ዳሩልኩብራ መጡ\nለመቀጠል እባክዎን ስልክ ቁትሮዎን ይላኩ`, {
        reply_markup: new Keyboard().requestContact("ላክ").resized().oneTime(),
      });
    }
  });

  bot.command("course", async (ctx) => {
    clearMsg(ctx);
    await sendCourses(ctx.chat.id, ctx);
  });

  bot.on("my_chat_member", async (ctx) => {
    console.log("my_chat_member", ctx.chat);
    if (
      ctx.chat.type == "channel" &&
      ctx.myChatMember.new_chat_member.status == "administrator"
    ) {
      const channel = await prisma.channel.findFirst({
        where: { chatId: ctx.chat.id },
      });
      if (!channel) {
        await prisma.channel.create({
          data: {
            title: ctx.chat.title,
            chatId: ctx.chat.id,
          },
        });
        // .catch((err) => {
        //   console.log("ERROR :: ", err);
        // });
      } else {
      }
    } else {
    }
  });

  bot.on("chat_member", async (ctx) => {
    console.log("chat_member");
    const status = ctx.chatMember.new_chat_member.status;
    const userId = ctx.chatMember.new_chat_member.user.id;
    if (status === "administrator") {
    } else {
      const order = await prisma.order.findFirst({
        where: {
          user: { chatId: userId },
          course: { channel: { chatId: ctx.chat.id } },
          status: "paid",
        },
        select: { course: { select: { titleAm: true } } },
      });
      if (order) {
        if (status === "member") {
          await ctx.api.sendMessage(
            userId,
            `የ${order.course.titleAm} ቻናል በተሳካ ሁኔታ ተቀላቅለዋል\nመልካም የትምህርት ግዜ`
          );
        } else {
          await ctx.api.sendMessage(
            userId,
            `ከ${order.course.titleAm} ቻናል ወጣህ\nበፈለጉት ጊዜ እንደገና መቀላቀል ይችላሉ`
          );
        }
      } else {
        if (status === "member") ctx.api.banChatMember(ctx.chat.id, userId);
        await ctx.api.sendMessage(
          userId,
          `የ${ctx.chat.title} ቻናል መቀላቀል ይፈልጋሉ?`,
          {
            reply_markup: new InlineKeyboard().webApp(
              "ኮርሶችን ይመልከቱ",
              `${process.env.MAIN_API!}/course`
            ),
          }
        );
      }
    }
  });

  bot.on("message:contact", async (ctx) => {
    clearMsg(ctx);
    const phoneNumber = `0${ctx.message.contact.phone_number.slice(-9)}`;
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      select: { id: true, chatId: true },
    });
    if (user) {
      if (Number(user.chatId) === ctx.from.id) {
        ctx.reply("መልካም የትምህርት ግዜ", {
          reply_markup: new InlineKeyboard().text("ደርሶች", "course"),
        });
      } else {
        await prisma.user.update({
          where: {
            phoneNumber,
          },
          data: { chatId: ctx.from.id },
        });
        await ctx.reply("ስልክ ቁትሮዎን ስላጋሩ እናመሰግናለን\nመልካም የትምህርት ግዜ");
        await sendCourses(ctx.chat.id, ctx);
      }
    } else {
      await ctx.reply("እንኳን ወደ ዳሩልኩብራ መጡ", {
        reply_markup: new InlineKeyboard().webApp(
          "ኮርሶችን ይመልከቱ",
          `${process.env.MAIN_API!}/course`
        ),
      });
    }
  });

  bot.on("callback_query:data", async (ctx) => {
    clearMsg(ctx);
    switch (ctx.callbackQuery.data) {
      case "course": {
        return await sendCourses(ctx.from.id, ctx);
      }
      default: {
      }
    }
  });

  bot.on("message", async (ctx) => {
    clearMsg(ctx);
  });

  bot.on("channel_post", (ctx) => {
    return;
    console.log("channel_post", ctx.chat);
  });

  bot.catch(({ error }) => {
    // console.error(`Error while handling update ${ctx.update.update_id}:`);
    if (error instanceof GrammyError) {
      console.error("Error in request:", error.description);
    } else if (error instanceof HttpError) {
      console.error("Could not contact Telegram:", error);
    } else {
      console.error("Unknown error:", error);
    }
  });

  bot
    .start({
      allowed_updates: [
        "business_connection",
        "business_message",
        "callback_query",
        "channel_post",
        "chat_boost",
        "chat_join_request",
        "chat_member",
        "chosen_inline_result",
        "deleted_business_messages",
        "edited_business_message",
        "edited_channel_post",
        "edited_message",
        "inline_query",
        "message",
        "message_reaction",
        "message_reaction_count",
        "my_chat_member",
        "poll",
        "poll_answer",
        "pre_checkout_query",
        "purchased_paid_media",
        "removed_chat_boost",
        "shipping_query",
      ],
    })
    .then(() => {
      console.log("BOT START");
    })
    .catch((err) => {
      console.log("BOT ERROR :: ", err);
    });
}

// await startBot();
