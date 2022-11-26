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

client.post('text', 'group', ['images'])//posts in the home page if no groupid is given

client.userData()//returns: {user: "own userdata", groups: "groups bot is in"}

client.notify('userid', {
  title: 'bot notification',
  content: 'this uses BetterPhotop, if a user isnt using BetterPhotop it wont work'
})

client.getPostById("postid")//returns post data

client.getUserById("userid")//returns user data by id
client.getUserByName("username")//returns user data by name

client.joinGroup("groupid")//joins the group if bot is invited
