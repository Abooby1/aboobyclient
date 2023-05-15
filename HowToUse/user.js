client.getUserById("6154f0d0a8d6d106c5b869b6").then(user => {
  user.bot//returns true if the user is the bot and false if its not

  user.id//returns userid of the user
  user.name//returns username of the user
  user.ping//returns the format that pings the user
  user.roles//returns array of roles
  user.status//returns parsed statuses

  user.settings.profilePicture//returns profile picture link of the user
  user.settings.profileBanner//returns profile banner link of the user
  user.settings.description//returns bio of the user
  user.settings.visibility//returns visibility of the user
  user.settings.pinnedPost//returns the postid of the pinned post of the user

  user.following//returns number of people user is following
  user.followers//returns number of people following the user
  user.parsedFollowers().then(callback => {
    //returns array of users following the user in callback
  })
  user.parsedFollowing().then(callback => {
    //returns array of users the user is following in callback
  })
  
  user.on(type, function() {
    //main listener for user | check on.js for properties
  })

  user.follow()//follows the user
  user.unfollow()//unfollows the user
  
  user.block()//blocks the user
  user.unblock()//unblocks the user

  user.report({//reports the user
    reason: "",
    report: ""
  })

  //mod
  user.ban({//ban the user | length: required, reason: required, terminate: optional
    length: 0,
    reason: "",
    terminate: true|false
  })
})
