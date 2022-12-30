/*
Hey, looks like youre trying to use aboobyclient for your bot.

In this file, you will get example code for how to start the bot.
*/

import {Client} from "aboobyclient";

const client = new Client({
  userid: "bot userid",
  token: "bot token | gotten from https://docs.google.com/forms/d/e/1FAIpQLSfphZMvTNPCI0yicT9js0Nty8EFybjoOiKCKkk2FtZ1dTOQXQ/viewform"//normal user tokens wont work
  config: {
    'statcontrib': false,//default: false | All bot actions contribute to the bot https://app.photop.live/?from=launchpage&user=621cba7663790d5ac3c2aca6#profile | boolean
    'groupConnection': true//default: true | true: group posts are connected with the default onPost | false: group posts arent connected with the default onPost, youll have to do onPost(callback => {}, groupid)
  }
})
