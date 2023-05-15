client.on(type, function() {
  //main listener function | check on.js for properties
})

client.post("text", {//posts in the home page if no groupid is given
  images: [],
  groupid: ""
})
client.createGroup({
  name: "",
  inviteType: "member|owner",
  image: ""
})

client.getPostById("postid").then(callback => {
  //returns post data in callback
})
client.getChatById("chatid").then(callback => {
  //returns chat data in callback
})
client.getBlocked().then(callback => {
  //returns array of users that bot has blocked
})
client.getUserById("userid").then(callback => {
  //returns user data by id in callback
})
client.getUserByName("username").then(callback => {
  //returns user data by name in callback
})
client.getGroupById("groupid").then(callback => {
  //returns group data in callback
})
client.getUsers("term").then(callback => {
  //returns array of users that match the term
})

client.groupInvites().then(callback => {
  //returns array of group invites
})
client.joinGroup({//will join group if valid code/groupid invite
  code: "optional",
  groupid: "optional"
})
client.leaveGroup("groupid")//will leave the group given if joined

client.postCache//returns an array containing post data cached with post.cache()

client.deletePost("postid")//deletes the post given
client.deleteChat("chatid")//deletes the chat given

client.updateBio("new bio")//changes the bots bio
client.updateUsername("new username")//changes the bots username
client.updateVisibility("new visibility | 'public', 'private', 'following'")//changes the bots profile visibility
client.updateProfilePic("./aboobyclient.png")//changes the bots profile picture, file is needed
client.updateBanner("./aboobyclient.png")//changes the bots banner, file is needed

client.unbanUser("userid")//will unban user if permissions are valid
