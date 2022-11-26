let user = client.getUserById("6154f0d0a8d6d106c5b869b6")

//if a users visibility is not "Public" most of the properties will be undefined

user.id//userid of the user
user.username//username of the user
user.roles//more than one role: array | one role: string

user.settings.profilePicture//profile picture id of the user
user.settings.profileBanner//profile banner id of the user
user.settings.description//bio of the user
user.settings.visibility//visibility of the user

user.follows.following//number of people user is following
user.follows.followers//number of people following the user

user.status().raw//raw number status
user.status().parsed//returns: status of user, "online", "offline", "group"

user.report("reason", "report")//reports a user
user.ban("length", "reason", "terminate")//ban the user selected | length: required, reason: required, terminate: optional
user.unban()//unbans a user
