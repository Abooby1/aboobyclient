client.onPost(post => {
  //listen for posts | go to onPost.js for properties
})

client.onDelete(deleteAction => {
  //listen for deletion | posts and chats | go to onDelete.js for properties
})

client.onInvite(invite => {
  //when someone invites to a group, data will be given | go to invite.js for properties
})

client.onMention(mention => {
   //when someone mentions your bot, itll send data | go to onMention.js for properties
})

client.onReady(ready => {
  console.log(ready)
  //logs "Ready!" when your bot is up and running
})

client.notify('userid', {
  title: 'bot notification',
  content: 'this uses BetterPhotop, if a user isnt using BetterPhotop it wont work'
})

client.post('text', 'group', ['images'])//posts in the home page if no groupid is given

client.getPostById("postid").then(callback => {
  //returns post data in callback
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

client.postCache//returns an array containing post data cached with post.cache()

await client.userData()//returns: {user: "own userdata", posts: "array of posts | up to 100", groups: "groups bot is in"}

client.joinGroup("groupid")//joins the group if bot is invited

client.deletePost("postid")//deletes the post given
client.deleteChat("chatid")//deletes the chat given

client.updateBio("new bio")//changes the bots bio
client.updateUsername("new username")//changes the bots username
client.updateVisibility("new visibility | 'public', 'private', 'following'")//changes the bots profile visibility
client.updateProfilePic("./aboobyclient.png")//changes the bots profile picture, file is needed
client.updateBanner("./aboobyclient.png")//changes the bots banner, file is needed
