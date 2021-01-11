// const rp = require("request-promise");
const { Telegraf } = require("telegraf");
const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const axios = require("axios");

const Token = "1317653249:AAED31f7vM0XjHRRc5CviCDH8d5-htvJSP0";
const bot = new Telegraf(Token);

const requestOptions = {
  method: "GET",
  uri: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
  headers: {
    "X-CMC_PRO_API_KEY": "f5eed1b6-f87a-4000-9cf9-1bab8244394d",
  },
  json: true,
  gzip: true,
};

// mes = 'Im alive'
// const send = {
//   method: "GET",
//   uri: `https://api.telegram.org/bot1317653249:AAED31f7vM0XjHRRc5CviCDH8d5-htvJSP0/sendMessage?chat_id=424362593&text=${mes}`,
// }
// const res = rp(send).promise();
// res

MongoClient.connect("mongodb://localhost:27017", async function (err, client) {
  try {
    await axios.get(
      `https://api.telegram.org/bot1317653249:AAED31f7vM0XjHRRc5CviCDH8d5-htvJSP0/sendMessage`,
      {
        headers: {
          Authorization: '',
        },
        params: {
          chat_id: "424362593",
          text: " ",
        },
      }
    );
  } catch (e) {
    console.log(e);
  }

  if (err) throw err;
  let db = client.db("usersdb");
  app.use(express.static(__dirname + "/public"));
  app.use(express.urlencoded());
  app.use(express.json());
  bot.telegram.setWebhook("https://e41c2a4a915c.ngrok.io/tl").then((res) => {
    console.log("webhook sucsess");
  });

  app.post("/tl", async (req, res) => {
    console.log(req.body);
    if (req.body.edited_message !== undefined) {
      res.sendStatus(200);
    }
    if (
      req.body.message.text === "subscribe btc" ||
      req.body.message.text === "subscribe eth" ||
      req.body.message.text === "subscribe zec" ||
      req.body.message.text === "unsubscribe btc" ||
      req.body.message.text === "unsubscribe eth" ||
      req.body.message.text === "unsubscribe zec" ||
      req.body.message.text === "/command1"
    ) {
      const user = {
        id: req.body.message.from.id,
        name: req.body.message.from.first_name,
      };
      // //добавь юзера в базу если его нет
      const users = await db.collection("users").find({ id: user.id }).count();
      if (users === 0) {
        await db.collection("users").insertOne(user);
      }
      // подписки
      if (req.body.message.text.includes("subscribe")) {
        const subscribes = {
          id: req.body.message.from.id,
          subscribes: req.body.message.text.replace("subscribe ", ""),
        };
        db.collection("subscribes").insertOne(subscribes);
      }
      // отписки
      if (req.body.message.text.includes("unsubscribe")) {
        const subscribes = {
          id: req.body.message.from.id,
          subscribes: req.body.message.text.replace("unsubscribe ", ""),
        };
        db.collection("subscribes").deleteOne({
          subscribes: req.body.message.text.replace("unsubscribe ", ""),
        });
      }

      // пойди на coinmarket найди курс
      const response = await rp(requestOptions).promise();
      const { data } = response;
      const messages = [];
      const dbArray = await db
        .collection("subscribes")
        .find({ id: user.id })
        .toArray();
      for (const subs of dbArray) {
        const { subscribes } = subs;
        const filter = data.filter(
          (t) => t.symbol === subscribes.toUpperCase()
        );
        if (filter.length) {
          const obj = filter[0];
          messages.push(
            `${subscribes.toUpperCase()} $${obj.quote.USD.price.toFixed(2)}`
          );
        }
      }
      const send = {
        method: "POST",
        uri: `https://api.telegram.org/bot1317653249:AAED31f7vM0XjHRRc5CviCDH8d5-htvJSP0/sendMessage?chat_id=${
          req.body.message.from.id
        }&text=${messages.join("\n")}`,
      };
      if (req.body.message.text === "/command1") {
        send;
      }
      // bot.telegram.sendMessage(req.body.message.from.id, messages.join("\n"));
      //   bot.telegram.sendMessage(req.body.message.from.id, "keyboard", {
      //     reply_markup: {
      //       keyboard: [
      //         ["subscribe btc", "unsubscribe btc"],
      //         ["subscribe eth", "unsubscribe eth"],
      //         ["subscribe zec", "unsubscribe zec"],
      //       ],
      //     },
      //   });
    }

    return res.sendStatus(200);
  });

  app.listen(1000, () => {
    console.log("app listening on port 1000!");
  });
});
