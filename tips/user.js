client.getUserById("6154f0d0a8d6d106c5b869b6").then(user => {
  user.classStatus//returns false if user privacy is not public, otherwise, itll return true
  user.bot//returns false if the user is the bot and true if its not

  user.id//userid of the user
  user.username//username of the user
  user.ping//returns the format that pings the user
  user.roles//more than one role: array | one role: string

  user.settings.profilePicture//profile picture id of the user
  user.settings.profileBanner//profile banner id of the user
  user.settings.description//bio of the user
  user.settings.visibility//visibility of the user

  await user.status().raw//raw number status
  await user.status().parsed//returns: status of user, "online", "offline", "group"

  user.follows.following//number of people user is following
  user.follows.followers//number of people following the user

  user.follow()//follows the given user
  user.unfollow()//unfollows the given user

  user.report("reason", "report")//reports a user

  //mod
  user.ban("length", "reason", "terminate")//ban the user selected | length: required, reason: required, terminate: optional
  user.unban()//unbans a user
})
