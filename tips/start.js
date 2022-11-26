import {Client} from 'aboobyclient'

const client = new Client({
  userid: 'bot userid',
  token: 'bot token (gotten from https://docs.google.com/forms/d/e/1FAIpQLSfphZMvTNPCI0yicT9js0Nty8EFybjoOiKCKkk2FtZ1dTOQXQ/viewform)',
  config: {//object "config" is optional
    'photopstats': false,//default: false | All bot actions contribute to https://photop-stats.abicamstudios.repl.co/ | boolean
    'groupConnection': true//default: true | true: group posts are connected with the default onPost | false: group posts arent connected with the default onPost, youll have to do onPost(callback => {}, groupid)
  }
})
