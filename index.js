const express = require("express");
const app = express();
const querystring = require("querystring");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const redirect_uri = process.env.redirect_uri;
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
// let token = [];

console.log("Come here");

app.use(cors());

app.get("/", (req, res) => {
  res.send("hello world");
});

setInterval(() => {
  axios({
    url: `https://darasimioni-fe448-default-rtdb.firebaseio.com/token.json`,
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (response.status === 200) {
      console.log(response.data);
      axios({
        method: "post",
        url: "https://accounts.spotify.com/api/token",
        data: querystring.stringify({
          grant_type: "refresh_token",
          refresh_token: response.data.refresh_token,
        }),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${new Buffer.from(
            `${client_id}:${client_secret}`
          ).toString("base64")}`,
        },
      })
        .then((res) => {
          axios({
            method: "put",
            url: `https://darasimioni-fe448-default-rtdb.firebaseio.com/access.json`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({
              access_token: res.data.access_token,
            }),
          }).then((res) => {
            if (res.status === 200) {
              // console.log("Good");
            } else {
              console.log(res.data);
            }
          });
          console.log(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      console.log(response.data);
    }
  });
}, 3600000);

const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = "spotify_auth_state";

app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope =
    "user-read-private user-read-email ugc-image-upload user-read-playback-state user-read-currently-playing user-modify-playback-state app-remote-control streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read";
  const queryParams = querystring.stringify({
    client_id: client_id,
    response_type: "code",
    redirect_uri: redirect_uri,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;

  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${client_id}:${client_secret}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        const { access_token, refresh_token } = response.data;
        axios({
          url: `https://api.spotify.com/v1/me`,
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }).then((response) => {
          if (response.status === 200) {
            console.log(response.data.id);
            if (response.data.id === "d39gx8ozqkgr68gmjcfay2gzx") {
              console.log("true");
              axios({
                method: "put",
                url: `https://darasimioni-fe448-default-rtdb.firebaseio.com/token.json`,
                headers: {
                  "Content-Type": "application/json",
                },
                data: JSON.stringify({
                  access_token: access_token,
                  refresh_token: refresh_token,
                }),
              }).then((res) => {
                if (res.status === 200) {
                  console.log("Good");
                } else {
                  console.log(res.data);
                }
              });
            }
          }
        });
        const queryParams = querystring.stringify({
          access_token,
          refresh_token,
        });
        res.redirect(`http://localhost:3000/?${queryParams}`);
      } else {
        res.redirect(`/?${querystring.stringify({ error: "invalid_token" })}`);
      }
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get("/refresh_token", (req, res) => {
  // const { refresh_token } = req.query;
  setInterval(() => {
    axios({
      url: `https://darasimioni-fe448-default-rtdb.firebaseio.com/token.json`,
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (response.status === 200) {
        console.log(response.data);
        axios({
          method: "post",
          url: "https://accounts.spotify.com/api/token",
          data: querystring.stringify({
            grant_type: "refresh_token",
            refresh_token: response.data.refresh_token,
          }),
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${new Buffer.from(
              `${client_id}:${client_secret}`
            ).toString("base64")}`,
          },
        })
          .then((response) => {
            console.log(response.data);
            res.send(response.data);
          })
          .catch((error) => {
            res.send(error);
          });
      } else {
        console.log(response.data);
      }
    });
  }, 5000);
});

app.listen(process.env.PORT || 8000, () => {
  console.log("listening on port 8000");
});
